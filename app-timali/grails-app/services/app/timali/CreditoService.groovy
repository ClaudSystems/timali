// grails-app/services/app/timali/CreditoService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import java.math.RoundingMode

@Transactional
class CreditoService {

    /**
     * Gera as parcelas do crédito baseado na definição
     */
    @Transactional
    void gerarParcelas(Credito credito) {
        println "GERANDO PARCELAS para crédito: ${credito.id}"

        if (!credito.definicaoCredito) {
            throw new RuntimeException("Crédito não possui definição")
        }

        def definicao = credito.definicaoCredito

        credito.percentualDeJuros = definicao.percentualDeJuros ?: 0
        credito.percentualJurosDeDemora = definicao.percentualJurosDeDemora ?: 0
        if (!credito.numeroDePrestacoes) credito.numeroDePrestacoes = definicao.numeroDePrestacoes ?: 1
        credito.maximoCobrancasMora = definicao.maximoCobrancasMora ?: 0

        if (!credito.dataEmissao) credito.dataEmissao = new Date()
        if (!credito.periodicidade) credito.periodicidade = definicao.periodicidade ?: Periodicidade.MENSAL

        credito.valorTotal = calcularValorTotal(credito.valorConcedido, definicao)
        credito.totalPrevisto = credito.valorTotal
        credito.save(flush: true)

        Calendar cal = Calendar.getInstance()
        cal.setTime(credito.dataEmissao)

        String periodo = credito.periodicidade.toString().toUpperCase()
        def sdf = new java.text.SimpleDateFormat('dd/MM/yyyy')

        BigDecimal valorParcela = (credito.valorTotal / credito.numeroDePrestacoes).setScale(2, RoundingMode.HALF_UP)
        BigDecimal somaParcelas = BigDecimal.ZERO
        BigDecimal saldoDevedor = credito.valorTotal

        for (int i = 1; i <= credito.numeroDePrestacoes; i++) {
            if (periodo.contains('SEMANAL')) {
                cal.add(Calendar.WEEK_OF_YEAR, 1)
            } else if (periodo.contains('QUINZENAL')) {
                cal.add(Calendar.DAY_OF_MONTH, 15)
            } else if (periodo.contains('DIARIO') || periodo.contains('DIÁRIO')) {
                cal.add(Calendar.DAY_OF_MONTH, 1)
            } else {
                cal.add(Calendar.MONTH, 1)
            }

            Date dataVencimento = cal.time

            BigDecimal valorEstaParcela = valorParcela
            if (i == credito.numeroDePrestacoes) {
                valorEstaParcela = credito.valorTotal - somaParcelas
            }
            somaParcelas += valorEstaParcela

            // CORREÇÃO: nome correto da variável
            BigDecimal taxaJuros = credito.percentualDeJuros ?: 0
            BigDecimal jurosParcela = credito.valorConcedido * (taxaJuros / 100)
            BigDecimal amortizacao = valorEstaParcela - jurosParcela
            saldoDevedor = saldoDevedor - amortizacao

            Parcela parcela = new Parcela()
            parcela.credito = credito
            parcela.numero = i
            parcela.descricao = "${i}ª Parcela"
            parcela.dataVencimento = dataVencimento
            parcela.valorParcela = valorEstaParcela
            parcela.valorAmortizacao = amortizacao.setScale(2, RoundingMode.HALF_UP)
            parcela.valorJuros = jurosParcela.setScale(2, RoundingMode.HALF_UP)
            parcela.saldoDevedor = saldoDevedor.setScale(2, RoundingMode.HALF_UP)
            parcela.status = StatusParcela.PENDENTE
            parcela.criadoPor = credito.criadoPor

            parcela.save(flush: true)
            println "Parcela ${i} - Venc: ${sdf.format(dataVencimento)}"
        }

        credito.dataValidade = cal.time
        credito.save(flush: true)

        println "PARCELAS GERADAS COM SUCESSO! Total: ${credito.numeroDePrestacoes}"
    }
    /**
     * Registra pagamento de uma parcela
     */
    void registrarPagamento(Parcela parcela, BigDecimal valorPago, String formaPagamento, String comprovativo) {
        parcela.dataPagamento = new Date()
        parcela.formaPagamento = formaPagamento
        parcela.comprovativo = comprovativo
        parcela.pagoNoPrazo = parcela.dataPagamento <= parcela.dataVencimento

        BigDecimal valorRestante = valorPago

        // 1. Pagar juros primeiro
        if (valorRestante > 0 && parcela.valorJuros > parcela.valorPagoJuros) {
            BigDecimal jurosPendente = parcela.valorJuros - parcela.valorPagoJuros
            BigDecimal pagoJuros = valorRestante < jurosPendente ? valorRestante : jurosPendente
            parcela.valorPagoJuros += pagoJuros
            valorRestante -= pagoJuros
        }

        // 2. Pagar multa se houver
        if (valorRestante > 0 && parcela.valorMulta > parcela.valorPagoMulta) {
            BigDecimal multaPendente = parcela.valorMulta - parcela.valorPagoMulta
            BigDecimal pagoMulta = valorRestante < multaPendente ? valorRestante : multaPendente
            parcela.valorPagoMulta += pagoMulta
            valorRestante -= pagoMulta
        }

        // 3. Pagar juros de demora se houver
        if (valorRestante > 0 && parcela.valorJurosDemora > parcela.valorPagoJurosDemora) {
            BigDecimal demoraPendente = parcela.valorJurosDemora - parcela.valorPagoJurosDemora
            BigDecimal pagoDemora = valorRestante < demoraPendente ? valorRestante : demoraPendente
            parcela.valorPagoJurosDemora += pagoDemora
            valorRestante -= pagoDemora
        }

        // 4. Restante vai para amortização
        if (valorRestante > 0) {
            parcela.valorPagoAmortizacao += valorRestante
        }

        // Atualizar total pago
        parcela.valorPago = parcela.valorPagoAmortizacao +
                parcela.valorPagoJuros +
                parcela.valorPagoMulta +
                parcela.valorPagoJurosDemora

        // Verificar se foi quitada
        BigDecimal totalDevido = parcela.valorParcela + parcela.valorMulta + parcela.valorJurosDemora
        if (parcela.valorPago >= totalDevido) {
            parcela.pago = true
            parcela.status = parcela.pagoNoPrazo ? StatusParcela.PAGA : StatusParcela.PAGA_COM_ATRASO
            parcela.emMora = false
        }

        parcela.save(flush: true, failOnError: true)
        atualizarTotaisCredito(parcela.credito)
    }

    /**
     * Atualiza status de mora das parcelas (executado por job diário)
     */
    void atualizarMoraParcelas() {
        Date hoje = new Date().clearTime()
        def parcelasVencidas = Parcela.findAllByPagoAndDataVencimentoLessThan(false, hoje)

        parcelasVencidas.each { p ->
            def cred = p.credito
            if (!cred) return

            p.emMora = true
            p.status = StatusParcela.VENCIDA
            p.diasAtraso = (hoje - p.dataVencimento) as Integer

            if (cred.maximoCobrancasMora > 0 && cred.periodicidadeMora) {
                calcularMoraParcela(p)
            }

            p.save(flush: true)
        }

        def creditosComMora = parcelasVencidas.collect { it.credito }.unique()
        creditosComMora.each { c ->
            c.emMora = true
            c.status = StatusCredito.EM_ATRASO
            c.save(flush: true)
        }
    }

    private void calcularMoraParcela(Parcela parcela) {
        def cred = parcela.credito
        int diasPorCobranca = cred.periodicidadeMora?.dias ?: 1
        int diasAtraso = parcela.diasAtraso

        int cobrancasDevidas = (diasAtraso / diasPorCobranca) as Integer
        if (cobrancasDevidas > cred.maximoCobrancasMora) {
            cobrancasDevidas = cred.maximoCobrancasMora
        }

        int cobrancasNovas = cobrancasDevidas - parcela.cobrancasMoraAplicadas
        if (cobrancasNovas > 0) {
            BigDecimal valorBase = cred.ignorarPagamentosNoPrazo ?
                    parcela.valorParcela : (parcela.valorParcela - parcela.valorPago)

            if (valorBase > 0) {
                BigDecimal moraPorCobranca = valorBase * (cred.percentualJurosDeDemora / 100)
                parcela.valorJurosDemora = moraPorCobranca * cobrancasDevidas
                parcela.cobrancasMoraAplicadas = cobrancasDevidas
            }
        }
    }

    /**
     * Calcula a data do primeiro vencimento baseado na data de emissão e periodicidade
     */
    private Date calcularPrimeiroVencimento(Date dataEmissao, def periodicidade) {
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataEmissao)

        String periodo = extrairNomePeriodicidade(periodicidade)

        switch (periodo) {
            case 'MENSAL':
                cal.add(Calendar.MONTH, 1)
                break
            case 'QUINZENAL':
                cal.add(Calendar.DAY_OF_MONTH, 15)
                break
            case 'SEMANAL':
                cal.add(Calendar.WEEK_OF_YEAR, 1)
                break
            case 'DIARIO':
                cal.add(Calendar.DAY_OF_MONTH, 1)
                break
            default:
                cal.add(Calendar.MONTH, 1)
        }

        return cal.time
    }

    /**
     * Calcula a próxima data de vencimento
     */
    private Date proximoVencimento(Date data, def periodicidade) {
        Calendar cal = Calendar.getInstance()
        cal.setTime(data)

        String periodo = extrairNomePeriodicidade(periodicidade)

        switch (periodo) {
            case 'MENSAL':
                cal.add(Calendar.MONTH, 1)
                break
            case 'QUINZENAL':
                cal.add(Calendar.DAY_OF_MONTH, 15)
                break
            case 'SEMANAL':
                cal.add(Calendar.WEEK_OF_YEAR, 1)
                break
            case 'DIARIO':
                cal.add(Calendar.DAY_OF_MONTH, 1)
                break
            default:
                cal.add(Calendar.MONTH, 1)
        }

        return cal.time
    }

    /**
     * Extrai o nome da periodicidade como string
     */
    private String extrairNomePeriodicidade(def periodicidade) {
        if (!periodicidade) return 'MENSAL'
        if (periodicidade instanceof String) return periodicidade.toUpperCase()

        String str = periodicidade.toString()
        if (str.contains('SEMANAL')) return 'SEMANAL'
        if (str.contains('MENSAL')) return 'MENSAL'
        if (str.contains('QUINZENAL')) return 'QUINZENAL'
        if (str.contains('DIARIO') || str.contains('Diário')) return 'DIARIO'

        return 'MENSAL'
    }

    /**
     * Extrai o nome da forma de cálculo como string
     */
    private String extrairNomeFormaCalculo(def formaCalculo) {
        if (!formaCalculo) return 'JUROS_SIMPLES'
        if (formaCalculo instanceof String) return formaCalculo.toUpperCase()

        String str = formaCalculo.toString()
        if (str.contains('JUROS_SIMPLES')) return 'JUROS_SIMPLES'
        if (str.contains('TAXA_FIXA')) return 'TAXA_FIXA'
        if (str.contains('PMT')) return 'PMT'
        if (str.contains('SAC')) return 'SAC'
        if (str.contains('JUROS_COMPOSTOS')) return 'JUROS_COMPOSTOS'

        return 'JUROS_SIMPLES'
    }

    /**
     * Calcula o valor total do crédito com juros
     */
    private BigDecimal calcularValorTotal(BigDecimal valor, def definicao) {
        String formaCalculo = extrairNomeFormaCalculo(definicao.formaDeCalculo)
        BigDecimal taxa = definicao.percentualDeJuros ?: 0.0
        Integer parcelas = definicao.numeroDePrestacoes ?: 1

        if (formaCalculo.contains('JUROS_SIMPLES')) {
            // Juros calculados sobre o valor concedido
            BigDecimal juros = valor * (taxa / 100) * parcelas
            return valor + juros
        } else {
            // Outros métodos - sem juros por enquanto
            return valor
        }
    }

    private BigDecimal calcularValorParcela(Credito credito) {
        if (!credito.numeroDePrestacoes || credito.numeroDePrestacoes == 0) {
            return credito.valorTotal
        }
        return credito.valorTotal / credito.numeroDePrestacoes
    }

    private BigDecimal calcularJurosParcela(BigDecimal saldoDevedor, BigDecimal taxa) {
        if (!taxa) return 0.0
        return saldoDevedor * (taxa / 100)
    }

    private void atualizarTotaisCredito(Credito credito) {
        def parcelas = credito.parcelas

        if (parcelas) {
            credito.totalPago = parcelas.sum { it.valorPago } as BigDecimal ?: 0.0
            credito.totalEmDivida = parcelas.findAll { !it.pago }.sum {
                it.valorParcela + it.valorMulta + it.valorJurosDemora - it.valorPago
            } as BigDecimal ?: 0.0
            credito.totalJurosPago = parcelas.sum { it.valorPagoJuros } as BigDecimal ?: 0.0
            credito.totalMultaPago = parcelas.sum { it.valorPagoMulta } as BigDecimal ?: 0.0
            credito.totalJurosDemoraPago = parcelas.sum { it.valorPagoJurosDemora } as BigDecimal ?: 0.0

            boolean todasPagas = parcelas.every { it.pago }

            if (todasPagas) {
                credito.quitado = true
                credito.emMora = false
                credito.status = StatusCredito.QUITADO
            }
        }

        credito.save(flush: true)
    }
}