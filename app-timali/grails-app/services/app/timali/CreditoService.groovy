// grails-app/services/app/timali/CreditoService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j
import java.math.RoundingMode
import java.text.SimpleDateFormat

@Slf4j
@Transactional
class CreditoService {

    /**
     * Gera as parcelas de um crédito.
     */
    def gerarParcelas(Credito creditoPersistido) {
        if (!creditoPersistido) {
            throw new IllegalArgumentException("Crédito não pode ser nulo")
        }
        if (!creditoPersistido.definicaoCredito) {
            throw new IllegalArgumentException("Crédito não possui definição de crédito associada")
        }

        DefinicaoCredito definicao = creditoPersistido.definicaoCredito
        SimpleDateFormat sdf = new SimpleDateFormat('dd/MM/yyyy')

        String periodicidade = creditoPersistido.periodicidade?.name() ?: 'MENSAL'
        Integer numeroParcelas = creditoPersistido.numeroDePrestacoes ?: 1
        BigDecimal principal = creditoPersistido.valorConcedido ?: BigDecimal.ZERO
        BigDecimal percentualJuros = creditoPersistido.percentualDeJuros ?
                new BigDecimal(creditoPersistido.percentualDeJuros.toString()) : BigDecimal.ZERO
        String formaCalculo = creditoPersistido.formaDeCalculo?.toString()?.toUpperCase() ?: 'PMT'

        if (numeroParcelas <= 0) {
            throw new IllegalArgumentException("Número de prestações deve ser maior que zero")
        }
        if (principal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valor concedido deve ser maior que zero")
        }

        Calendar calIter = Calendar.getInstance()
        calIter.setTime(creditoPersistido.dataEmissao ?: new Date())

        BigDecimal taxaPeriodoDecimal = BigDecimal.ZERO
        if (formaCalculo != 'TAXA_FIXA') {
            taxaPeriodoDecimal = taxaPorPeriodo(percentualJuros, periodicidade)
        }

        BigDecimal valorParcela
        BigDecimal valorTotalReal

        switch (formaCalculo) {
            case 'PMT':
                valorParcela = calcularPMT(principal, taxaPeriodoDecimal, numeroParcelas)
                valorTotalReal = valorParcela.multiply(new BigDecimal(numeroParcelas))
                break

            case 'JUROS_SIMPLES':
                BigDecimal jurosTotalSimples = principal.multiply(taxaPeriodoDecimal)
                        .multiply(new BigDecimal(numeroParcelas))
                valorTotalReal = principal.add(jurosTotalSimples).setScale(2, RoundingMode.HALF_UP)
                valorParcela = valorTotalReal.divide(new BigDecimal(numeroParcelas), 10, RoundingMode.HALF_UP)
                break

            case 'JUROS_COMPOSTOS':
                BigDecimal fator = BigDecimal.ONE.add(taxaPeriodoDecimal).pow(numeroParcelas)
                valorTotalReal = principal.multiply(fator).setScale(2, RoundingMode.HALF_UP)
                valorParcela = valorTotalReal.divide(new BigDecimal(numeroParcelas), 10, RoundingMode.HALF_UP)
                break

            case 'SAC':
                BigDecimal amortizacaoSAC = principal.divide(new BigDecimal(numeroParcelas), 10, RoundingMode.HALF_UP)
                BigDecimal saldoSAC = principal
                BigDecimal totalJurosSAC = BigDecimal.ZERO
                for (int j = 0; j < numeroParcelas; j++) {
                    BigDecimal jurosParcelaSAC = saldoSAC.multiply(taxaPeriodoDecimal)
                    totalJurosSAC = totalJurosSAC.add(jurosParcelaSAC)
                    saldoSAC = saldoSAC.subtract(amortizacaoSAC)
                }
                valorTotalReal = principal.add(totalJurosSAC).setScale(2, RoundingMode.HALF_UP)
                valorParcela = valorTotalReal.divide(new BigDecimal(numeroParcelas), 10, RoundingMode.HALF_UP)
                break

            case 'TAXA_FIXA':
            default:
                BigDecimal taxaFixaDecimal = percentualJuros.divide(new BigDecimal(100), 10, RoundingMode.HALF_UP)
                BigDecimal jurosTotal = principal.multiply(taxaFixaDecimal)
                valorTotalReal = principal.add(jurosTotal).setScale(2, RoundingMode.HALF_UP)
                valorParcela = valorTotalReal.divide(new BigDecimal(numeroParcelas), 10, RoundingMode.HALF_UP)
                break
        }

        // Atualiza totais no crédito
        creditoPersistido.valorTotal = valorTotalReal.setScale(2, RoundingMode.HALF_UP)
        creditoPersistido.totalPrevisto = valorTotalReal.setScale(2, RoundingMode.HALF_UP)
        creditoPersistido.totalEmDivida = valorTotalReal.setScale(2, RoundingMode.HALF_UP)
        creditoPersistido.save(flush: true, failOnError: true)

        log.info("=" * 50)
        log.info("GERAÇÃO DE PARCELAS")
        log.info("Crédito: ${creditoPersistido.numero}")
        log.info("Forma: ${formaCalculo}")
        log.info("Principal: ${principal}")
        log.info("Valor Total: ${valorTotalReal}")
        log.info("=" * 50)

        // Gerar parcelas
        BigDecimal saldoDevedor = principal
        BigDecimal somaParcelas = BigDecimal.ZERO

        for (int i = 1; i <= numeroParcelas; i++) {
            switch (periodicidade) {
                case 'SEMANAL':
                    calIter.add(Calendar.WEEK_OF_YEAR, 1)
                    break
                case 'QUINZENAL':
                    calIter.add(Calendar.DAY_OF_MONTH, 15)
                    break
                case 'DIARIO':
                case 'DIÁRIO':
                    calIter.add(Calendar.DAY_OF_MONTH, 1)
                    break
                default:
                    calIter.add(Calendar.MONTH, 1)
            }

            Date dataVencimentoBase = calIter.time
            Date dataAjustada = ajustarDataParaDiaUtil(dataVencimentoBase, definicao)

            BigDecimal jurosParcela
            BigDecimal amortizacao
            BigDecimal valorEstaParcela

            if (formaCalculo == 'TAXA_FIXA') {
                jurosParcela = BigDecimal.ZERO
                amortizacao = valorParcela
                valorEstaParcela = valorParcela
            } else if (formaCalculo == 'SAC') {
                amortizacao = principal.divide(new BigDecimal(numeroParcelas), 10, RoundingMode.HALF_UP)
                jurosParcela = saldoDevedor.multiply(taxaPeriodoDecimal)
                valorEstaParcela = amortizacao.add(jurosParcela)
            } else {
                jurosParcela = saldoDevedor.multiply(taxaPeriodoDecimal)
                amortizacao = valorParcela.subtract(jurosParcela)
                if (amortizacao.compareTo(BigDecimal.ZERO) < 0) {
                    amortizacao = BigDecimal.ZERO
                    jurosParcela = valorParcela
                }
                valorEstaParcela = valorParcela
            }

            BigDecimal novoSaldo = saldoDevedor.subtract(amortizacao)

            if (i == numeroParcelas) {
                amortizacao = saldoDevedor
                novoSaldo = BigDecimal.ZERO
                valorEstaParcela = amortizacao.add(jurosParcela)

                BigDecimal ajusteTotal = valorTotalReal.subtract(somaParcelas)
                if (ajusteTotal.compareTo(BigDecimal.ZERO) != 0) {
                    valorEstaParcela = ajusteTotal
                    amortizacao = valorEstaParcela.subtract(jurosParcela)
                    if (amortizacao.compareTo(BigDecimal.ZERO) < 0) {
                        amortizacao = BigDecimal.ZERO
                        jurosParcela = valorEstaParcela
                    }
                }
            } else if (novoSaldo.compareTo(BigDecimal.ZERO) < 0) {
                amortizacao = amortizacao.add(novoSaldo)
                novoSaldo = BigDecimal.ZERO
            }

            somaParcelas = somaParcelas.add(valorEstaParcela)
            saldoDevedor = novoSaldo.setScale(2, RoundingMode.HALF_UP)

            Parcela parcela = new Parcela(
                    credito: creditoPersistido,
                    numero: i,
                    descricao: "${i}ª Parcela",
                    dataVencimento: dataAjustada,
                    valorParcela: valorEstaParcela.setScale(2, RoundingMode.HALF_UP),
                    valorAmortizacao: amortizacao.setScale(2, RoundingMode.HALF_UP),
                    valorJuros: jurosParcela.setScale(2, RoundingMode.HALF_UP),
                    saldoDevedor: saldoDevedor,
                    status: StatusParcela.PENDENTE,
                    criadoPor: creditoPersistido.criadoPor
            )

            parcela.save(flush: true, failOnError: true)
        }

        // RECALCULAR TOTAIS APÓS GERAR PARCELAS
        recalcularAposGerarParcelas(creditoPersistido)

        log.info("✅ Parcelas geradas com sucesso!")
    }

    // ====================================================================
    // MÉTODOS DE RECÁLCULO (NOVOS)
    // ====================================================================

    /**
     * Recalcula os totais de um crédito específico
     */
    Credito recalcularTotais(Credito credito) {
        if (!credito) return null

        if (credito.parcelas && credito.parcelas.size() > 0) {
            credito.totalPrevisto = (credito.parcelas.sum { it.valorParcela ?: 0.0 } ?: 0.0) as BigDecimal
            credito.totalPago = (credito.parcelas.sum { it.valorPago ?: 0.0 } ?: 0.0) as BigDecimal
            credito.totalPagoNoPrazo = (credito.parcelas.findAll { it.pagoNoPrazo }.sum { it.valorPago ?: 0.0 } ?: 0.0) as BigDecimal
            credito.totalEmDivida = credito.totalPrevisto - credito.totalPago
            credito.totalJurosPago = (credito.parcelas.sum { it.jurosPago ?: 0.0 } ?: 0.0) as BigDecimal
            credito.totalMultaPago = (credito.parcelas.sum { it.multaPago ?: 0.0 } ?: 0.0) as BigDecimal
            credito.totalJurosDemoraPago = (credito.parcelas.sum { it.jurosDemoraPago ?: 0.0 } ?: 0.0) as BigDecimal

            // Atualizar status
            if (credito.totalEmDivida <= 0 && credito.totalPago > 0) {
                credito.status = StatusCredito.QUITADO
                credito.quitado = true
            } else if (credito.emMora) {
                credito.status = StatusCredito.EM_ATRASO
            } else {
                credito.status = StatusCredito.ATIVO
            }
        } else {
            credito.totalPrevisto = credito.valorTotal ?: 0.0
            credito.totalEmDivida = (credito.valorTotal ?: 0.0) - (credito.totalPago ?: 0.0)
        }

        credito.save(flush: true, failOnError: true)
        return credito
    }

    /**
     * Recalcula os totais de TODOS os créditos
     */
    def recalcularTodosCreditos() {
        log.info("🔄 Iniciando recálculo de todos os créditos...")

        List<Credito> todosCreditos = Credito.findAll()
        int atualizados = 0
        int comErro = 0

        todosCreditos.each { Credito credito ->
            try {
                recalcularTotais(credito)
                atualizados++
                log.debug("✅ #${credito.numero} - Saldo: ${credito.totalEmDivida}")
            } catch (Exception e) {
                comErro++
                log.error("❌ Erro #${credito.numero}: ${e.message}")
            }
        }

        log.info("✅ Recálculo concluído! Atualizados: ${atualizados}, Erros: ${comErro}")

        return [atualizados: atualizados, comErro: comErro, total: todosCreditos.size()]
    }

    /**
     * Recalcula totais após gerar parcelas
     */
    def recalcularAposGerarParcelas(Credito credito) {
        if (!credito) return

        credito.totalPrevisto = credito.parcelas?.sum { it.valorParcela ?: 0.0 } ?: credito.valorTotal
        credito.totalEmDivida = credito.totalPrevisto - (credito.totalPago ?: 0.0)
        credito.totalPago = credito.parcelas?.sum { it.valorPago ?: 0.0 } ?: 0.0

        credito.save(flush: true, failOnError: true)

        log.info("✅ #${credito.numero} - Previsto: ${credito.totalPrevisto} | Pago: ${credito.totalPago} | Dívida: ${credito.totalEmDivida}")
    }

    // ====================================================================
    // MÉTODOS AUXILIARES
    // ====================================================================

    private BigDecimal taxaPorPeriodo(BigDecimal percentualAnual, String periodicidade, Integer periodosPorAno = null) {
        if (!percentualAnual || percentualAnual.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO
        }

        BigDecimal taxaAnual = percentualAnual.divide(new BigDecimal(100), 10, RoundingMode.HALF_UP)

        int periodos
        switch (periodicidade?.toUpperCase()) {
            case 'MENSAL': periodos = 12; break
            case 'SEMANAL': periodos = 52; break
            case 'QUINZENAL': periodos = periodosPorAno ?: 24; break
            case 'DIARIO':
            case 'DIÁRIO': periodos = 365; break
            default: periodos = 12
        }

        return taxaAnual.divide(new BigDecimal(periodos), 10, RoundingMode.HALF_UP)
    }

    private BigDecimal calcularPMT(BigDecimal principal, BigDecimal taxaPeriodo, Integer n) {
        if (!principal || principal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO
        }
        if (!taxaPeriodo || taxaPeriodo.compareTo(BigDecimal.ZERO) <= 0) {
            return principal.divide(new BigDecimal(n), 10, RoundingMode.HALF_UP)
        }

        BigDecimal umMaisR = BigDecimal.ONE.add(taxaPeriodo)
        BigDecimal potenciaNegativa = BigDecimal.ONE.divide(umMaisR.pow(n), 10, RoundingMode.HALF_UP)
        BigDecimal denominador = BigDecimal.ONE.subtract(potenciaNegativa)

        if (denominador.compareTo(BigDecimal.ZERO) <= 0) {
            return principal.divide(new BigDecimal(n), 10, RoundingMode.HALF_UP)
        }

        return principal.multiply(taxaPeriodo).divide(denominador, 10, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP)
    }

    Date ajustarDataParaDiaUtil(Date data, DefinicaoCredito definicao) {
        return data
    }

    /**
     * Registra pagamento de uma parcela
     */
    @Transactional
    def registrarPagamento(Parcela parcela, BigDecimal valorPago, String formaPagamento, String comprovativo) {
        if (!parcela) throw new IllegalArgumentException("Parcela não pode ser nula")
        if (parcela.pago) throw new IllegalStateException("Parcela já foi paga")

        parcela.valorPago = valorPago ?: parcela.valorParcela
        parcela.dataPagamento = new Date()
        parcela.pago = true
        parcela.status = StatusParcela.PAGO
        parcela.formaPagamento = formaPagamento
        parcela.comprovativo = comprovativo

        if (parcela.dataPagamento <= parcela.dataVencimento) {
            parcela.pagoNoPrazo = true
        }

        parcela.save(flush: true, failOnError: true)

        // Recalcular totais do crédito
        recalcularTotais(parcela.credito)

        log.info("✅ Pagamento registrado - Parcela #${parcela.numero} - Crédito #${parcela.credito.numero}")
    }
}