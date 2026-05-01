package app.timali

import grails.rest.RestfulController
import grails.validation.ValidationException
import java.text.SimpleDateFormat

class PagamentoController extends RestfulController<Pagamento> {

    PagamentoService pagamentoService

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
     * Registrar novo pagamento
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

        // Construir itens do recibo
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
}