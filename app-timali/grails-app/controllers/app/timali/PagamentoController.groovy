// grails-app/controllers/app/timali/PagamentoController.groovy
package app.timali

import grails.rest.RestfulController
import grails.validation.ValidationException
import grails.converters.JSON
import java.text.SimpleDateFormat

class PagamentoController extends RestfulController<Pagamento> {

    PagamentoService pagamentoService
    DiarioService diarioService
    def springSecurityService

    PagamentoController() {
        super(Pagamento)
    }

    def index(Integer max) {
        params.max = Math.min(max ?: 50, 100)
        respond listAllResources(params), model: [pagamentoCount: countResources()]
    }

    /**
     * Buscar créditos por cliente (para autocomplete)
     */
    def buscarCreditosPorCliente() {
        String query = params.query ?: ''

        if (query.length() < 2) {
            respond([message: "Digite pelo menos 2 caracteres"], status: 400)
            return
        }

        try {
            def creditos = pagamentoService.buscarCreditosPorCliente(query)

            def resultado = creditos.collect { Credito credito ->
                [
                        id: credito.id,
                        numero: credito.numero,
                        cliente: credito.entidade?.nome,
                        nuit: credito.entidade?.nuit,
                        valorTotal: credito.valorTotal,
                        totalPago: credito.totalPago,
                        saldo: credito.totalEmDivida,
                        status: credito.status?.toString(),
                        dataEmissao: credito.dataEmissao
                ]
            }

            respond resultado
        } catch (Exception e) {
            log.error("Erro ao buscar créditos: ${e.message}", e)
            respond([message: e.message], status: 500)
        }
    }

    /**
     * Buscar parcelas de um crédito
     */
    def buscarParcelas(Long creditoId) {
        try {
            def parcelas = pagamentoService.buscarParcelasPendentes(creditoId)

            def resultado = parcelas.collect { Parcela parcela ->
                [
                        id: parcela.id,
                        numero: parcela.numero,
                        dataVencimento: parcela.dataVencimento,
                        valorParcela: parcela.valorParcela,
                        valorAmortizacao: parcela.valorAmortizacao,
                        valorJuros: parcela.valorJuros,
                        valorPago: parcela.valorPago ?: 0.0,
                        valorMulta: parcela.valorMulta,
                        valorJurosDemora: parcela.valorJurosDemora,
                        saldoDevedor: parcela.saldoDevedor,
                        pago: parcela.pago,
                        emMora: parcela.emMora,
                        diasAtraso: parcela.diasAtraso,
                        status: parcela.status?.toString(),
                        descricao: parcela.descricao
                ]
            }

            respond resultado
        } catch (Exception e) {
            log.error("Erro ao buscar parcelas: ${e.message}", e)
            respond([message: e.message], status: 500)
        }
    }

    /**
     * Calcular valores de mora para parcelas em atraso
     */
    def calcularMora(Long parcelaId) {
        try {
            def valores = pagamentoService.calcularValoresMora(parcelaId)
            respond valores
        } catch (Exception e) {
            log.error("Erro ao calcular mora: ${e.message}", e)
            respond([message: e.message], status: 500)
        }
    }

    /**
     * Registrar novo pagamento - COM ASSOCIAÇÃO AO DIÁRIO
     */
    def registrarPagamento() {
        def cmd = new RegistroPagamentoCommand()
        bindData(cmd, request.JSON)

        if (!cmd.validate()) {
            respond cmd.errors, status: 422
            return
        }

        try {
            def pagamento = pagamentoService.registrarPagamento(cmd)

            // ***** ASSOCIAR PAGAMENTO AO DIÁRIO DO DIA *****
            try {
                associarPagamentoAoDiario(pagamento)
            } catch (Exception e) {
                log.error("Erro ao associar pagamento ao diário: ${e.message}", e)
            }

            respond pagamento, status: 201
        } catch (ValidationException e) {
            respond e.errors, status: 422
        } catch (Exception e) {
            log.error("Erro ao registrar pagamento: ${e.message}", e)
            respond([message: e.message], status: 500)
        }
    }

    /**
     * Resumo do caixa do dia
     */
    def resumoCaixa() {
        Date data = new Date()
        if (params.data) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
                data = sdf.parse(params.data)
            } catch (Exception e) {
                respond([message: "Formato de data inválido. Use yyyy-MM-dd"], status: 400)
                return
            }
        }

        def resumo = pagamentoService.resumoCaixa(data)
        respond resumo
    }

    /**
     * Listar pagamentos do dia
     */
    def pagamentosDoDia() {
        Date data = new Date()
        if (params.data) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
                data = sdf.parse(params.data)
            } catch (Exception e) {
                respond([message: "Formato de data inválido. Use yyyy-MM-dd"], status: 400)
                return
            }
        }

        def pagamentos = pagamentoService.listarPagamentosDoDia(data)
        respond pagamentos
    }

    /**
     * Gerar recibo
     */
    def gerarRecibo(Long id) {
        def pagamento = Pagamento.get(id)
        if (!pagamento) {
            notFound()
            return
        }

        def itens = []

        if (pagamento.valorParcela > 0) {
            itens << [descricao: 'Valor Parcela', valor: pagamento.valorParcela]
        }
        if (pagamento.valorJuros > 0) {
            itens << [descricao: 'Juros', valor: pagamento.valorJuros]
        }
        if (pagamento.valorJurosDemora > 0) {
            itens << [descricao: 'Juros Demora', valor: pagamento.valorJurosDemora]
        }
        if (pagamento.valorMulta > 0) {
            itens << [descricao: 'Multa', valor: pagamento.valorMulta]
        }

        def recibo = [
                numero: pagamento.numeroRecibo,
                data: pagamento.dataPagamento,
                cliente: pagamento.entidade?.nome,
                nuit: pagamento.entidade?.nuit,
                formaPagamento: pagamento.formaPagamento,
                referencia: pagamento.referenciaPagamento,
                itens: itens,
                totalPago: pagamento.valorPago,
                troco: pagamento.troco,
                usuario: pagamento.usuario?.username,
                credito: pagamento.credito?.numero,
                descricao: pagamento.descricao
        ]

        respond recibo
    }

    // ***** MÉTODO PRIVADO PARA ASSOCIAR PAGAMENTO AO DIÁRIO *****
    private void associarPagamentoAoDiario(Pagamento pagamento) {
        if (!pagamento.dataPagamento) {
            log.warn "Pagamento sem data, usando data atual"
            pagamento.dataPagamento = new Date()
        }

        // ***** Usar a data do PAGAMENTO, não a data atual *****
        Calendar cal = Calendar.getInstance()
        cal.setTime(pagamento.dataPagamento)  // ← data do pagamento
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        Date dataLimpa = cal.getTime()

        // Buscar ou criar diário PARA A DATA DO PAGAMENTO
        Diario diario = Diario.findByDataReferencia(dataLimpa)
        if (!diario) {
            diario = new Diario()
            diario.dataReferencia = dataLimpa
            diario.estado = 'aberto'
            diario.numeroDiario = diarioService.gerarNumeroDiario(dataLimpa)
            diario.totalRecebimentos = 0.0
            diario.totalSaidas = 0.0
            diario.saldo = 0.0
            diario.dateCreated = new Date()
            diario.lastUpdated = new Date()
            diario.criadoPor = pagamento.criadoPor

            def currentUser = springSecurityService?.currentUser
            if (currentUser) {
                diario.usuario = currentUser
            }

            if (!diario.save(flush: true)) {
                log.error("Erro ao criar diário: ${diario.errors}")
                return
            }
            log.info("Diário criado para data ${dataLimpa.format('dd/MM/yyyy')}: ${diario.numeroDiario}")
        }

        // Associar pagamento ao diário da data correta
        pagamento.diario = diario
        pagamento.save(flush: true)

        if (!diario.pagamentos?.contains(pagamento)) {
            diario.addToPagamentos(pagamento)
        }

        diario.totalRecebimentos = diario.pagamentos?.sum { it.valorPago ?: 0 } ?: 0.0
        diario.totalSaidas = diario.saidas?.sum { it.valor ?: 0 } ?: 0.0
        diario.saldo = diario.totalRecebimentos - diario.totalSaidas
        diario.lastUpdated = new Date()
        diario.save(flush: true)

        log.info("Pagamento ${pagamento.numeroRecibo} associado ao diário ${diario.numeroDiario} (data: ${dataLimpa.format('dd/MM/yyyy')})")
    }


}