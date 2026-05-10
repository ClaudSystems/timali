// grails-app/services/app/timali/CreditoService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j
import java.math.RoundingMode
import java.text.SimpleDateFormat

@Slf4j
@Transactional
class CreditoService {

        // ... outros serviços ...
        DiarioCaixaService diarioCaixaService  // ← ADICIONAR

    // ====================================================================
// MÉTODOS DE CÁLCULO DE MORA (NOVOS)
// ====================================================================

/**
 * Calcula e aplica moras a TODAS as parcelas vencidas de um crédito.
 * Deve ser chamado antes de retornar o crédito para o frontend.
 */
    /**
     * Calcula e aplica moras a TODAS as parcelas vencidas de um crédito.
     * Leva em conta TODAS as regras definidas na criação do crédito.
     */
    /**
     * Zera hora/minuto/segundo/milissegundo de uma data
     */
    private Date zerarHora(Date data) {
        if (!data) return null
        Calendar cal = Calendar.getInstance()
        cal.setTime(data)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.time
    }

    Credito calcularMorasAntesDeExibir(Credito credito) {
        if (!credito || credito.quitado) return credito

        log.info("🔍 Calculando moras para crédito #${credito.numero}")



        Date hoje = zerarHora(new Date())
        boolean teveAlteracao = false

        // Regras do crédito (definidas na criação)
        BigDecimal percentualJurosDemora = credito.percentualJurosDeDemora ?: BigDecimal.ZERO
        boolean ignorarPagamentosNoPrazo = credito.ignorarPagamentosNoPrazo ?: false
        int maximoCobrancasMora = credito.maximoCobrancasMora ?: 0
        def periodicidadeMora = credito.periodicidadeMora

        // Se não tem juros de demora configurado, não calcula mora
        if (percentualJurosDemora.compareTo(BigDecimal.ZERO) <= 0) {
            log.debug("  ⏭️ Crédito #${credito.numero} não tem juros de demora configurados")
            return credito
        }

        credito.parcelas?.each { Parcela parcela ->
            if (parcela.pago) return // Pula parcelas já pagas

            if (parcela.dataVencimento.before(hoje)) {
                long diffMillis = hoje.time - parcela.dataVencimento.time
                int diasAtraso = (diffMillis / (1000 * 60 * 60 * 24)) as Integer

                if (diasAtraso > 0) {
                    parcela.diasAtraso = diasAtraso
                    parcela.emMora = true
                    parcela.status = StatusParcela.VENCIDA

                    // ===== REGRA: Definir valor base para cálculo =====
                    BigDecimal valorBase
                    if (ignorarPagamentosNoPrazo) {
                        // Ignora pagamentos parciais - cobra mora sobre o valor TOTAL da parcela
                        valorBase = parcela.valorParcela ?: BigDecimal.ZERO
                    } else {
                        // Desconta pagamentos parciais já feitos
                        valorBase = (parcela.valorParcela ?: BigDecimal.ZERO) - (parcela.valorPago ?: BigDecimal.ZERO)
                    }

                    if (valorBase.compareTo(BigDecimal.ZERO) <= 0) {
                        return // Nada a cobrar
                    }

                    // ===== REGRA: Periodicidade da mora =====
                    int diasPorCobranca = 1 // Padrão: diário
                    if (periodicidadeMora) {
                        String perMora = periodicidadeMora.toString().toUpperCase()
                        if (perMora.contains('SEMANAL')) {
                            diasPorCobranca = 7
                        } else if (perMora.contains('QUINZENAL')) {
                            diasPorCobranca = 15
                        } else if (perMora.contains('MENSAL')) {
                            diasPorCobranca = 30
                        }
                    }

                    int cobrancasDevidas = (diasAtraso / diasPorCobranca) as Integer

                    // ===== REGRA: Limite máximo de cobranças =====
                    if (maximoCobrancasMora > 0 && cobrancasDevidas > maximoCobrancasMora) {
                        cobrancasDevidas = maximoCobrancasMora
                    }

                    // ===== REGRA: Não recalcular se já foi aplicado =====
                    if (cobrancasDevidas <= parcela.cobrancasMoraAplicadas) {
                        return
                    }

                    // ===== CÁLCULO DA MORA =====
                    BigDecimal taxaMora = percentualJurosDemora.divide(new BigDecimal(100), 10, RoundingMode.HALF_UP)
                    BigDecimal valorMora = valorBase.multiply(taxaMora)
                            .multiply(new BigDecimal(cobrancasDevidas))
                            .setScale(2, RoundingMode.HALF_UP)

                    parcela.valorJurosDemora = valorMora
                    parcela.cobrancasMoraAplicadas = cobrancasDevidas
                    teveAlteracao = true

                    log.info("  📍 Parcela ${parcela.numero}: ${diasAtraso}d → " +
                            "${cobrancasDevidas}x${diasPorCobranca}d = ${valorMora} MZN " +
                            "(taxa: ${percentualJurosDemora}%, base: ${valorBase})")
                }
            }
        }

        if (teveAlteracao) {
            credito.emMora = true
            credito.status = StatusCredito.EM_ATRASO

            // Salvar TODAS as alterações
            credito.parcelas?.each { it.save(flush: true) }
            credito.save(flush: true)
        }

        return credito
    }


/**
 * Calcula o número de cobranças de mora baseado na periodicidade configurada
 */
    private int calcularCobrancasMora(int diasAtraso, Credito credito) {
        if (!credito.periodicidadeMora || credito.maximoCobrancasMora <= 0) {
            return diasAtraso // Padrão: 1 cobrança por dia
        }

        int diasPorCobranca = 1

        switch (credito.periodicidadeMora.toString().toUpperCase()) {
            case 'SEMANAL':
            case 'SEMANALMENTE':
                diasPorCobranca = 7
                break
            case 'QUINZENAL':
            case 'QUINZENALMENTE':
                diasPorCobranca = 15
                break
            case 'MENSAL':
            case 'MENSALMENTE':
                diasPorCobranca = 30
                break
            default:
                diasPorCobranca = 1
        }

        int cobrancas = (diasAtraso / diasPorCobranca) as Integer
        if (cobrancas > credito.maximoCobrancasMora) {
            cobrancas = credito.maximoCobrancasMora
        }

        return cobrancas
    }

/**
 * Recalcula moras de TODOS os créditos ativos (para job diário)
 */
    def recalcularMorasTodosCreditos() {
        log.info("🔄 Iniciando recálculo de moras de todos os créditos...")

        List<Credito> creditosAtivos = Credito.findAllByQuitado(false)
        int processados = 0
        int comMora = 0

        creditosAtivos.each { Credito credito ->
            try {
                def antes = credito.emMora
                calcularMorasAntesDeExibir(credito)
                processados++
                if (credito.emMora && !antes) comMora++
            } catch (Exception e) {
                log.error("❌ Erro ao calcular moras #${credito.numero}: ${e.message}")
            }
        }

        log.info("✅ Moras recalculadas! Processados: ${processados}, Novas moras: ${comMora}")
        return [processados: processados, comMora: comMora]
    }

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
            try {
                Pagamento pagamento = new Pagamento()
                pagamento.credito = parcela.credito
                pagamento.entidade = parcela.credito?.entidade
                pagamento.parcela = parcela
                pagamento.dataPagamento = dataEfetiva
                pagamento.formaPagamento = formaPagamento ?: 'DINHEIRO'
                pagamento.valorPago = valorPago
                pagamento.valorParcela = parcela.valorParcela
                pagamento.numeroRecibo = comprovativo ?: "REC-${dataEfetiva.format('yyyyMMdd')}-${System.currentTimeMillis() % 100000}"
                pagamento.descricao = "Pgto ${parcela.numero}ª/${parcela.credito?.numero}"
                pagamento.referenciaPagamento = comprovativo
                pagamento.troco = 0.0
                pagamento.usuario = parcela.credito?.usuario
                pagamento.criadoPor = parcela.credito?.criadoPor ?: 'sistema'
                pagamento.valorJuros = 0.0
                pagamento.valorMulta = 0.0
                pagamento.valorJurosDemora = 0.0

                if (pagamento.save(flush: true)) {
                    log.info "✅ Recibo ${pagamento.numeroRecibo} - ${valorPago} MZN"

                    // Associar ao Diário
                    Calendar cal = Calendar.getInstance()
                    cal.setTime(dataEfetiva)
                    cal.set(Calendar.HOUR_OF_DAY, 0)
                    cal.set(Calendar.MINUTE, 0)
                    cal.set(Calendar.SECOND, 0)
                    cal.set(Calendar.MILLISECOND, 0)
                    Date dataLimpa = cal.getTime()

                    Diario diario = Diario.findByDataReferencia(dataLimpa)
                    if (!diario) {
                        diario = new Diario()
                        diario.dataReferencia = dataLimpa
                        diario.estado = 'aberto'
                        diario.numeroDiario = "DIA-${dataLimpa.format('yyyyMMdd')}-001"
                        diario.totalRecebimentos = 0.0
                        diario.totalSaidas = 0.0
                        diario.saldo = 0.0
                        diario.dateCreated = new Date()
                        diario.lastUpdated = new Date()
                        diario.criadoPor = pagamento.criadoPor
                        diario.usuario = pagamento.usuario
                        diario.save(flush: true)
                        log.info "📒 Diário criado: ${diario.numeroDiario}"
                    }

                    pagamento.diario = diario
                    pagamento.save(flush: true)

                    diario.addToPagamentos(pagamento)
                    diario.totalRecebimentos = diario.pagamentos?.sum { it.valorPago ?: 0 } ?: 0.0
                    diario.totalSaidas = diario.saidas?.sum { it.valor ?: 0 } ?: 0.0
                    diario.saldo = diario.totalRecebimentos - diario.totalSaidas
                    diario.lastUpdated = new Date()
                    diario.save(flush: true)

                    log.info "📒 Recibo ${pagamento.numeroRecibo} → Diário ${diario.numeroDiario}"
                }
            } catch (Exception e) {
                log.error "Erro ao criar Pagamento/Diário: ${e.message}", e
            }


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
    // No CreditoService.groovy

    // CreditoService.groovy - método recalcularTotais

    Credito recalcularTotais(Credito credito) {
        if (!credito) return null

        if (credito.parcelas && credito.parcelas.size() > 0) {
            // Total previsto
            credito.totalPrevisto = (credito.parcelas.sum { it.valorParcela ?: 0.0 } ?: 0.0) as BigDecimal

            // Total pago
            credito.totalPago = (credito.parcelas.sum { it.valorPago ?: 0.0 } ?: 0.0) as BigDecimal

            // Total pago no prazo - GARANTIR QUE NÃO SEJA NULL
            def pagasNoPrazo = credito.parcelas.findAll { it.pagoNoPrazo }
            credito.totalPagoNoPrazo = (pagasNoPrazo.sum { it.valorPago ?: 0.0 } ?: 0.0) as BigDecimal

            // Total em dívida
            credito.totalEmDivida = ((credito.totalPrevisto ?: 0.0) - (credito.totalPago ?: 0.0)).max(0.0) as BigDecimal

            // Totais de juros e multas
            credito.totalJurosPago = (credito.parcelas.sum { it.valorPagoJuros ?: 0.0 } ?: 0.0) as BigDecimal
            credito.totalMultaPago = (credito.parcelas.sum { it.valorPagoMulta ?: 0.0 } ?: 0.0) as BigDecimal
            credito.totalJurosDemoraPago = (credito.parcelas.sum { it.valorPagoJurosDemora ?: 0.0 } ?: 0.0) as BigDecimal

            // Verificar status
            boolean todasPagas = credito.parcelas.every { it.pago }

            if (todasPagas && credito.totalEmDivida <= 0) {
                credito.status = StatusCredito.QUITADO
                credito.quitado = true
                credito.ativo = false
                credito.emMora = false
            } else if (credito.parcelas.any { it.dataVencimento < new Date() && !it.pago }) {
                credito.status = StatusCredito.EM_ATRASO
                credito.emMora = true
            } else {
                credito.status = StatusCredito.ATIVO
                credito.emMora = false
            }
        } else {
            credito.totalPrevisto = credito.valorTotal ?: 0.0
            credito.totalPago = credito.totalPago ?: 0.0
            credito.totalPagoNoPrazo = credito.totalPagoNoPrazo ?: 0.0  // Garantir valor padrão
            credito.totalEmDivida = ((credito.totalPrevisto ?: 0.0) - (credito.totalPago ?: 0.0)).max(0.0)
            credito.totalJurosPago = credito.totalJurosPago ?: 0.0
            credito.totalMultaPago = credito.totalMultaPago ?: 0.0
            credito.totalJurosDemoraPago = credito.totalJurosDemoraPago ?: 0.0
        }

        // GARANTIR QUE NENHUM CAMPO OBRIGATÓRIO SEJA NULL
        credito.totalPagoNoPrazo = credito.totalPagoNoPrazo ?: 0.0
        credito.totalJurosPago = credito.totalJurosPago ?: 0.0
        credito.totalMultaPago = credito.totalMultaPago ?: 0.0
        credito.totalJurosDemoraPago = credito.totalJurosDemoraPago ?: 0.0

        if (!credito.save(flush: true, failOnError: true)) {
            log.error("Erro ao salvar crédito: ${credito.errors}")
        }

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

    // CreditoService.groovy - método registrarPagamento

    @Transactional
    def registrarPagamento(Parcela parcela, BigDecimal valorPago, String formaPagamento, String comprovativo, Date dataPagamento = null) {
        if (!parcela) throw new IllegalArgumentException("Parcela não pode ser nula")
        if (!valorPago || valorPago <= 0) throw new IllegalArgumentException("Valor pago deve ser maior que zero")

        log.info("💰 Registrando pagamento - Parcela #${parcela.numero} - Valor: ${valorPago}")

        Date dataEfetiva = dataPagamento ?: new Date()

        // 1. Atualizar parcela (acumular valor)
        BigDecimal valorPagoAnterior = parcela.valorPago ?: 0.0
        BigDecimal valorTotalPago = valorPagoAnterior + valorPago

        parcela.valorPago = valorTotalPago
        parcela.formaPagamento = formaPagamento
        parcela.comprovativo = comprovativo

        if (valorTotalPago >= parcela.valorParcela) {
            parcela.valorPago = parcela.valorParcela
            parcela.pago = true
            parcela.dataPagamento = dataEfetiva
            parcela.status = StatusParcela.PAGA

            if (parcela.dataPagamento <= parcela.dataVencimento) {
                parcela.pagoNoPrazo = true
            }

            log.info("✅ Parcela #${parcela.numero} QUITADA")
        } else {
            log.info("📝 Pagamento parcial - Parcela #${parcela.numero}: ${valorTotalPago}/${parcela.valorParcela}")
        }

        if (!parcela.save(flush: true, failOnError: true)) {
            log.error("Erro ao salvar parcela: ${parcela.errors}")
            throw new RuntimeException("Erro ao salvar parcela: ${parcela.errors}")
        }

        // 2. ***** NOVO: Criar registro de Pagamento (recibo) *****
        Pagamento pagamento = criarRegistroPagamento(parcela, valorPago, formaPagamento, comprovativo, dataEfetiva)

        // 3. ***** NOVO: Associar ao Diário *****
        if (pagamento) {
           diarioCaixaService.associarPagamentoAoDiario(pagamento)
        }

        // 4. Recalcular totais do crédito
        recalcularTotais(parcela.credito)

        return parcela
    }

// ***** NOVOS MÉTODOS PRIVADOS *****

/**
 * Cria um registro de Pagamento (recibo) para cada pagamento recebido
 */
    private Pagamento criarRegistroPagamento(Parcela parcela, BigDecimal valorPago, String formaPagamento, String comprovativo, Date dataPagamento) {
        try {
            Pagamento pagamento = new Pagamento()
            pagamento.credito = parcela.credito
            pagamento.entidade = parcela.credito?.entidade
            pagamento.parcela = parcela
            pagamento.dataPagamento = dataPagamento
            pagamento.formaPagamento = formaPagamento ?: 'DINHEIRO'
            pagamento.valorPago = valorPago
            pagamento.valorParcela = parcela.valorParcela
            pagamento.numeroRecibo = comprovativo ?: gerarNumeroRecibo()
            pagamento.descricao = "Pgto ${parcela.numero}ª Prestação - ${parcela.credito?.numero}"
            pagamento.referenciaPagamento = comprovativo
            pagamento.troco = 0.0
            pagamento.usuario = parcela.credito?.usuario
            pagamento.criadoPor = parcela.credito?.criadoPor ?: 'sistema'

            if (pagamento.save(flush: true, failOnError: true)) {
                log.info "✅ Recibo ${pagamento.numeroRecibo} criado - ${valorPago} MZN"
                return pagamento
            } else {
                log.error "Erro ao criar pagamento: ${pagamento.errors}"
                return null
            }
        } catch (Exception e) {
            log.error "Erro ao criar registro de pagamento: ${e.message}", e
            return null
        }
    }

/**
 * Associa o pagamento ao Diário do dia
 */


/**
 * Gera número de recibo único
 */
    private String gerarNumeroRecibo() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd")
        String prefixo = sdf.format(new Date())
        int count = Pagamento.count() + 1
        return "REC-${prefixo}-${String.format('%04d', count)}"
    }

/**
 * Gera número do diário
 */
    private String gerarNumeroDiario(Date data) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd")
        String prefixo = sdf.format(data)
        def count = Diario.countByDataReferencia(data) + 1
        return "DIA-${prefixo}-${String.format('%03d', count)}"
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
    // grails-app/services/app/timali/CreditoService.groovy

/**
 * Registra pagamento de uma parcela (aceita pagamento parcial)
 */

}