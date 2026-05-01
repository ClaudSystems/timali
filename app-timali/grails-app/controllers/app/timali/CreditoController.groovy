// grails-app/controllers/app/timali/CreditoController.groovy
package app.timali

import grails.gorm.transactions.Transactional
import grails.converters.JSON
import java.math.RoundingMode
import java.text.SimpleDateFormat

class CreditoController {

    static responseFormats = ['json']

    CreditoService creditoService

    // ====================================================================
    // MÉTODOS AUXILIARES REUTILIZÁVEIS
    // ====================================================================

    /**
     * Converte qualquer valor de data para String no formato yyyy-MM-dd.
     * Trata java.sql.Timestamp, java.util.Date e null.
     */
    private String safeDate(data) {
        try {
            if (data == null) return null

            Date dateObj
            if (data instanceof java.sql.Timestamp) {
                dateObj = new Date(data.time)
            } else if (data instanceof Date) {
                dateObj = data
            } else {
                return null
            }

            def sdf = new java.text.SimpleDateFormat('yyyy-MM-dd')
            return sdf.format(dateObj)
        } catch (e) {
            log.error("Erro ao formatar data: ${e.message}")
            return null
        }
    }

    /**
     * Converte Enum para String de forma segura.
     */
    private String safeEnum(val) {
        try { return val?.toString() } catch (e) { return null }
    }

    /**
     * Converte valor para BigDecimal de forma segura.
     */
    private BigDecimal safeDecimal(val) {
        try { return (val ?: 0.0) as BigDecimal } catch (e) { return 0.0 }
    }

    // ====================================================================
    // CRUD Básico
    // ====================================================================

    // GET /api/creditos
    // CreditoController.groovy

    def buscarPagamentosPorCredito(Long creditoId) {
        def credito = Credito.get(creditoId)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        def pagamentos = Parcela.findAllByCreditoAndPago(credito, true, [sort: 'dataPagamento', order: 'desc'])

        def resultado = pagamentos.collect { parcela ->
            [
                    id: parcela.id,
                    numero: parcela.numero,
                    dataPagamento: parcela.dataPagamento,
                    dataVencimento: parcela.dataVencimento,
                    valorParcela: parcela.valorParcela,
                    valorPago: parcela.valorPago,
                    formaPagamento: parcela.formaPagamento,
                    comprovativo: parcela.comprovativo,
                    pagoNoPrazo: parcela.pagoNoPrazo,
                    descricao: parcela.descricao,
                    creditoId: credito.id,
                    creditoNumero: credito.numero,
                    cliente: credito.entidade?.nome,
                    nuit: credito.entidade?.nuit,
                    documento: credito.entidade?.numeroDeIdentificao,
                    saldoDevedor: credito.totalEmDivida
            ]
        }

        render(resultado as JSON)
    }

// Buscar TODOS os pagamentos (para histórico geral)
    def historicoPagamentos() {
        params.max = Math.min(params.max as Integer ?: 50, 200)
        params.offset = params.offset as Integer ?: 0

        def pagamentos = Parcela.createCriteria().list(max: params.max, offset: params.offset) {
            eq('pago', true)
            order('dataPagamento', 'desc')
        }

        def resultado = pagamentos.collect { parcela ->
            [
                    id: parcela.id,
                    numero: parcela.numero,
                    dataPagamento: parcela.dataPagamento,
                    valorParcela: parcela.valorParcela,
                    valorPago: parcela.valorPago,
                    formaPagamento: parcela.formaPagamento,
                    comprovativo: parcela.comprovativo,
                    creditoId: parcela.credito?.id,
                    creditoNumero: parcela.credito?.numero,
                    cliente: parcela.credito?.entidade?.nome,
                    nuit: parcela.credito?.entidade?.nuit,
                    documento: parcela.credito?.entidade?.numeroDeIdentificao,
                    saldoDevedor: parcela.credito?.totalEmDivida
            ]
        }

        render(resultado as JSON)
    }

// Buscar pagamentos por período
    // CreditoController.groovy

    def pagamentosPorPeriodo() {
        try {
            def sdf = new SimpleDateFormat("yyyy-MM-dd")
            Date dataInicio = params.dataInicio ? sdf.parse(params.dataInicio as String) : new Date() - 30
            Date dataFim = params.dataFim ? sdf.parse(params.dataFim as String) : new Date()
            
            // Garantir que o dataFim vá até o último milissegundo do dia
            Date dataFimAjustada = dataFim.updated(hour: 23, minute: 59, second: 59)

            def pagamentos = Parcela.createCriteria().list {
                eq('pago', true)
                between('dataPagamento', dataInicio, dataFimAjustada)
                order('dataPagamento', 'desc')
                maxResults(200)
            }
            // ... resto do collect
        } catch (Exception e) {
            render status: 400, text: [message: "Formato de data inválido. Use yyyy-MM-dd"] as JSON
            return
        }

        def resultado = pagamentos.collect { parcela ->
            [
                    id: parcela.id,
                    numero: parcela.numero,
                    dataPagamento: parcela.dataPagamento,
                    valorParcela: parcela.valorParcela,
                    valorPago: parcela.valorPago,
                    formaPagamento: parcela.formaPagamento,
                    comprovativo: parcela.comprovativo,
                    creditoId: parcela.credito?.id,
                    creditoNumero: parcela.credito?.numero,
                    cliente: parcela.credito?.entidade?.nome,
                    nuit: parcela.credito?.entidade?.nuit,
                    documento: parcela.credito?.entidade?.numeroDeIdentificao,
                    saldoDevedor: parcela.credito?.totalEmDivida
            ]
        }

        render(resultado as JSON)
    }
    def index() {
        def max = params.max ? params.int('max') : 20
        def offset = params.offset ? params.int('offset') : 0

        def creditos = Credito.list(max: max, offset: offset, sort: 'dataEmissao', order: 'desc')

        def result = []

        creditos.each { credito ->
            try {
                BigDecimal saldoDevedor = BigDecimal.ZERO
                try {
                    if (credito.parcelas && credito.parcelas.size() > 0) {
                        BigDecimal totalParcelas = credito.parcelas.sum { it.valorParcela ?: 0.0 } ?: 0.0
                        BigDecimal totalPago = credito.parcelas.sum { it.valorPago ?: 0.0 } ?: 0.0
                        saldoDevedor = totalParcelas - totalPago
                    } else {
                        saldoDevedor = (credito.valorTotal ?: 0.0) - (credito.totalPago ?: 0.0)
                    }
                } catch (e) {
                    saldoDevedor = (credito.valorTotal ?: 0.0) - (credito.totalPago ?: 0.0)
                }
                if (saldoDevedor < 0) saldoDevedor = BigDecimal.ZERO

                def entidadeData = null
                try {
                    if (credito.entidade) {
                        entidadeData = [id: credito.entidade.id, nome: credito.entidade.nome]
                    }
                } catch (e) {
                    entidadeData = [id: null, nome: 'N/A']
                }

                result << [
                        id: credito.id,
                        numero: credito.numero,
                        valorConcedido: safeDecimal(credito.valorConcedido),
                        valorTotal: safeDecimal(credito.valorTotal),
                        totalPago: safeDecimal(credito.totalPago),
                        totalEmDivida: saldoDevedor.setScale(2, RoundingMode.HALF_UP),
                        numeroDePrestacoes: credito.numeroDePrestacoes,
                        periodicidade: safeEnum(credito.periodicidade),
                        formaDeCalculo: safeEnum(credito.formaDeCalculo),
                        status: safeEnum(credito.status),
                        dataEmissao: safeDate(credito.dataEmissao),
                        dataValidade: safeDate(credito.dataValidade),
                        quitado: credito.quitado ?: false,
                        emMora: credito.emMora ?: false,
                        ativo: credito.ativo ?: false,
                        entidade: entidadeData
                ]
            } catch (Exception e) {
                log.error("Erro ao processar crédito ${credito?.id}: ${e.message}")
            }
        }

        render result as JSON
    }

    // GET /api/creditos/{id}
    def mostrar() {
        Long id = params.long('id')

        try {
            def credito = Credito.get(id)
            if (!credito) {
                render status: 404, text: [message: "Crédito não encontrado"] as JSON
                return
            }

            // Logs de depuração
            println "=" * 60
            println "🔍 DEPURAÇÃO - Crédito ID: ${credito.id}"
            println "   dataEmissao (raw): ${credito.dataEmissao}"
            println "   dataEmissao class: ${credito.dataEmissao?.class?.name}"
            println "   dataEmissao safeDate: ${safeDate(credito.dataEmissao)}"
            println "=" * 60

            // Definição de crédito
            def definicaoCreditoData = null
            try {
                if (credito.definicaoCredito) {
                    definicaoCreditoData = [
                            id: credito.definicaoCredito?.id,
                            nome: credito.definicaoCredito?.nome
                    ]
                }
            } catch (Exception e) {
                log.warn("DefinicaoCredito não encontrada para crédito ${id}: ${e.message}")
                definicaoCreditoData = [id: null, nome: 'Definição removida']
            }

            // Entidade
            def entidadeData = null
            try {
                if (credito.entidade) {
                    entidadeData = [
                            id: credito.entidade?.id,
                            nome: credito.entidade?.nome,
                            codigo: credito.entidade?.codigo
                    ]
                }
            } catch (Exception e) {
                log.warn("Entidade não encontrada para crédito ${id}: ${e.message}")
                entidadeData = [id: null, nome: 'N/A', codigo: '']
            }

            // Usuário
            def usuarioData = null
            try {
                if (credito.usuario) {
                    usuarioData = [
                            id: credito.usuario?.id,
                            username: credito.usuario?.username
                    ]
                }
            } catch (Exception e) {
                log.warn("Usuario não encontrado para crédito ${id}: ${e.message}")
                usuarioData = [id: null, username: 'Sistema']
            }

            // Parcelas
            def parcelas = []
            try {
                credito.parcelas?.each { p ->
                    try {
                        parcelas << [
                                id: p?.id,
                                numero: p?.numero ?: 0,
                                dataVencimento: safeDate(p?.dataVencimento),
                                valorParcela: safeDecimal(p?.valorParcela),
                                valorAmortizacao: safeDecimal(p?.valorAmortizacao),
                                valorJuros: safeDecimal(p?.valorJuros),
                                valorMulta: safeDecimal(p?.valorMulta),
                                valorJurosDemora: safeDecimal(p?.valorJurosDemora),
                                valorPago: safeDecimal(p?.valorPago),
                                saldoDevedor: safeDecimal(p?.saldoDevedor),
                                status: safeEnum(p?.status),
                                diasAtraso: p?.diasAtraso ?: 0,
                                pago: p?.pago ?: false
                        ]
                    } catch (e) {
                        log.error("Erro na parcela ${p?.id}: ${e.message}")
                    }
                }
            } catch (e) {
                log.error("Erro ao acessar parcelas: ${e.message}")
            }

            // Totais
            BigDecimal totalParcelas = parcelas.sum { (it.valorParcela ?: 0.0) as BigDecimal } ?: 0.0
            BigDecimal totalPago = parcelas.sum { (it.valorPago ?: 0.0) as BigDecimal } ?: 0.0

            def result = [
                    id: credito.id,
                    numero: credito.numero,
                    valorConcedido: safeDecimal(credito.valorConcedido),
                    valorTotal: safeDecimal(credito.valorTotal),
                    percentualDeJuros: safeDecimal(credito.percentualDeJuros),
                    percentualJurosDeDemora: safeDecimal(credito.percentualJurosDeDemora),
                    numeroDePrestacoes: credito.numeroDePrestacoes,
                    periodicidade: safeEnum(credito.periodicidade),
                    formaDeCalculo: safeEnum(credito.formaDeCalculo),
                    status: safeEnum(credito.status),
                    dataEmissao: safeDate(credito.dataEmissao),
                    dataValidade: safeDate(credito.dataValidade),
                    quitado: credito.quitado ?: false,
                    emMora: credito.emMora ?: false,
                    ativo: credito.ativo ?: false,
                    descricao: credito.descricao,
                    criadoPor: credito.criadoPor,
                    entidade: entidadeData,
                    definicaoCredito: definicaoCreditoData,
                    usuario: usuarioData,
                    parcelas: parcelas,
                    totais: [
                            totalPrevisto: totalParcelas.setScale(2, RoundingMode.HALF_UP),
                            totalPago: totalPago.setScale(2, RoundingMode.HALF_UP),
                            saldoPendente: (totalParcelas - totalPago).setScale(2, RoundingMode.HALF_UP)
                    ]
            ]

            render result as JSON

        } catch (Exception e) {
            log.error("ERRO CRÍTICO no mostrar(${id}): ${e.message}", e)
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    // ====================================================================
    // MÉTODOS DE CRIAÇÃO/ATUALIZAÇÃO
    // ====================================================================

    @Transactional
    def save() {
        def data = request.JSON
        criarCredito(data)
    }

    @Transactional
    def criarCreditoAction() {
        def data = request.JSON
        criarCredito(data)
    }

    @Transactional
    def update() {
        def credito = Credito.get(params.id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }
        credito.properties = request.JSON
        credito.save(flush: true)
        respond credito
    }

    @Transactional
    def patch() {
        update()
    }

    @Transactional
    def delete() {
        def credito = Credito.get(params.id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }
        credito.delete(flush: true)
        render status: 204
    }

    // ====================================================================
    // MÉTODO AUXILIAR PARA CRIAR CRÉDITO
    // ====================================================================

    private def criarCredito(data) {
        println "=" * 50
        println "CRIANDO CRÉDITO"
        println "=" * 50

        try {
            if (!data.entidadeId) {
                render status: 400, text: [message: "Cliente é obrigatório"] as JSON
                return
            }
            if (!data.definicaoCreditoId) {
                render status: 400, text: [message: "Definição de crédito é obrigatória"] as JSON
                return
            }
            if (!data.valorConcedido) {
                render status: 400, text: [message: "Valor concedido é obrigatório"] as JSON
                return
            }

            Entidade entidade = Entidade.get(data.entidadeId as Long)
            if (!entidade) {
                render status: 404, text: [message: "Cliente não encontrado"] as JSON
                return
            }

            DefinicaoCredito definicao = DefinicaoCredito.get(data.definicaoCreditoId as Long)
            if (!definicao) {
                render status: 404, text: [message: "Definição de crédito não encontrada"] as JSON
                return
            }

            def usuario = Usuario.findByUsername('admin')
            if (!usuario) {
                usuario = Usuario.list()?.first()
            }
            if (!usuario) {
                render status: 500, text: [message: "Usuário não encontrado"] as JSON
                return
            }

            Credito credito = new Credito()
            credito.entidade = entidade
            credito.definicaoCredito = definicao
            credito.usuario = usuario
            credito.valorConcedido = data.valorConcedido as BigDecimal
            credito.percentualDeJuros = (data.percentualDeJuros ?: definicao.percentualDeJuros) as BigDecimal
            credito.percentualJurosDeDemora = (data.percentualJurosDeDemora ?: definicao.percentualJurosDeDemora) as BigDecimal
            credito.numeroDePrestacoes = (data.numeroDePrestacoes ?: definicao.numeroDePrestacoes) as Integer

            // Periodicidade
            if (data.periodicidade) {
                try {
                    credito.periodicidade = Periodicidade.valueOf(data.periodicidade as String)
                } catch (Exception e) {
                    credito.periodicidade = definicao.periodicidade ?: Periodicidade.MENSAL
                }
            } else {
                credito.periodicidade = definicao.periodicidade ?: Periodicidade.MENSAL
            }

            // Forma de cálculo
            if (data.formaDeCalculo) {
                try {
                    credito.formaDeCalculo = FormaCalculo.valueOf(data.formaDeCalculo as String)
                } catch (Exception e) {
                    credito.formaDeCalculo = definicao.formaDeCalculo ?: FormaCalculo.JUROS_SIMPLES
                }
            } else {
                credito.formaDeCalculo = definicao.formaDeCalculo ?: FormaCalculo.JUROS_SIMPLES
            }

            // Data de emissão
            if (data.dataEmissao) {
                try {
                    def sdf = new java.text.SimpleDateFormat('yyyy-MM-dd')
                    credito.dataEmissao = sdf.parse(data.dataEmissao.toString())
                } catch (Exception e) {
                    println "Erro ao parsear data, usando data atual: ${e.message}"
                    credito.dataEmissao = new Date()
                }
            } else {
                credito.dataEmissao = new Date()
            }

            credito.numero = gerarNumeroCredito()
            credito.descricao = data.descricao
            credito.ignorarPagamentosNoPrazo = data.ignorarPagamentosNoPrazo ?: false
            credito.criadoPor = usuario.username
            credito.status = StatusCredito.ATIVO
            credito.ativo = true

            if (!credito.validate()) {
                render status: 422, text: [errors: credito.errors] as JSON
                return
            }

            credito.save(flush: true)
            creditoService.gerarParcelas(credito)

            render status: 201, text: [
                    id: credito.id,
                    numero: credito.numero,
                    message: "Crédito criado com sucesso"
            ] as JSON

        } catch (Exception e) {
            println "EXCEÇÃO: ${e.message}"
            e.printStackTrace()
            render status: 500, text: [message: "Erro interno: ${e.message}"] as JSON
        }
    }

    // ====================================================================
    // ENDPOINTS CUSTOMIZADOS
    // ====================================================================
    // grails-app/controllers/app/timali/CreditoController.groovy

    def buscarCreditosPorCliente() {
        String termo = params.termo
        if (!termo || termo.length() < 2) {
            render([] as JSON)
            return
        }

        def creditos = Credito.createCriteria().list {
            entidade {
                or {
                    ilike('nome', "%${termo}%")
                    ilike('codigo', "%${termo}%")
                    ilike('nuit', "%${termo}%")
                }
            }
            eq('ativo', true)
            or {
                eq('status', StatusCredito.ATIVO)
                eq('status', StatusCredito.EM_ATRASO)
            }
            maxResults(20)
            order('dataEmissao', 'desc')
        }

        def resultado = creditos.collect { credito ->
            [
                    id: credito.id,
                    numero: credito.numero,
                    cliente: credito.entidade?.nome,
                    codigo: credito.entidade?.codigo,
                    nuit: credito.entidade?.nuit,
                    documento: credito.entidade?.numeroDeIdentificao ?: credito.entidade?.nuit ?: '',
                    valorTotal: credito.valorTotal,
                    totalPago: credito.totalPago,
                    totalEmDivida: credito.totalEmDivida,
                    saldo: credito.totalEmDivida,
                    status: credito.status?.toString(),
                    ativo: credito.ativo,
                    dataEmissao: credito.dataEmissao
            ]
        }

        render(resultado as JSON)
    }

    def buscarClientes() {
        String termo = params.termo
        if (!termo || termo.length() < 2) {
            render([] as JSON)
            return
        }

        def clientes = Entidade.createCriteria().list {
            or {
                ilike('codigo', "%${termo}%")
                ilike('nome', "%${termo}%")
            }
            maxResults(20)
            order('nome', 'asc')
        }

        def resultado = clientes.collect { cliente ->
            [
                    id: cliente.id,
                    codigo: cliente.codigo,
                    nome: cliente.nome,
                    documento: cliente.numeroDeIdentificao ?: cliente.nuit ?: ''
            ]
        }

        render(resultado as JSON)
    }

    def parcelas(Long creditoId) {
        def credito = Credito.get(creditoId)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        try {
            def parcelas = credito.parcelas?.sort { it.numero }?.collect { parcela ->
                [
                        id: parcela.id,
                        numero: parcela.numero,
                        descricao: parcela.descricao,
                        dataVencimento: safeDate(parcela.dataVencimento),
                        dataPagamento: safeDate(parcela.dataPagamento),
                        valorParcela: parcela.valorParcela,
                        valorAmortizacao: parcela.valorAmortizacao,
                        valorJuros: parcela.valorJuros,
                        valorPago: parcela.valorPago,
                        valorPagoAmortizacao: parcela.valorPagoAmortizacao,
                        valorPagoJuros: parcela.valorPagoJuros,
                        valorMulta: parcela.valorMulta,
                        valorJurosDemora: parcela.valorJurosDemora,
                        valorPagoMulta: parcela.valorPagoMulta,
                        valorPagoJurosDemora: parcela.valorPagoJurosDemora,
                        saldoDevedor: parcela.saldoDevedor,
                        diasAtraso: parcela.diasAtraso,
                        pago: parcela.pago,
                        pagoNoPrazo: parcela.pagoNoPrazo,
                        emMora: parcela.emMora,
                        status: safeEnum(parcela.status),
                        formaPagamento: parcela.formaPagamento,
                        comprovativo: parcela.comprovativo,
                        observacao: parcela.observacao,
                        cobrancasMoraAplicadas: parcela.cobrancasMoraAplicadas
                ]
            } ?: []

            render parcelas as JSON
        } catch (Exception e) {
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    @Transactional
    def invalidar(Long id) {
        def credito = Credito.get(id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }
        if (credito.totalPago > 0) {
            render status: 400, text: [message: "Crédito com pagamentos não pode ser invalidado"] as JSON
            return
        }
        credito.ativo = false
        credito.status = StatusCredito.CANCELADO
        credito.save(flush: true)
        render status: 200, text: [message: "Crédito invalidado com sucesso"] as JSON
    }

    @Transactional
    def arquivar(Long id) {
        def credito = Credito.get(id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }
        credito.ativo = false
        credito.save(flush: true)
        render status: 200, text: [message: "Crédito arquivado com sucesso"] as JSON
    }

    def extrato(Long id) {
        def credito = Credito.get(id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        def parcelas = credito.parcelas?.sort { it.numero }?.collect { [
                numero: it.numero,
                dataVencimento: safeDate(it.dataVencimento),
                valorParcela: it.valorParcela,
                valorAmortizacao: it.valorAmortizacao,
                valorJuros: it.valorJuros,
                valorMulta: it.valorMulta,
                valorJurosDemora: it.valorJurosDemora,
                valorPago: it.valorPago,
                saldoDevedor: it.saldoDevedor,
                pago: it.pago,
                status: safeEnum(it.status)
        ] } ?: []

        render([
                credito: [
                        id: credito.id,
                        numero: credito.numero,
                        entidade: credito.entidade?.nome,
                        valorConcedido: credito.valorConcedido,
                        valorTotal: credito.valorTotal,
                        status: safeEnum(credito.status),
                        dataEmissao: safeDate(credito.dataEmissao)
                ],
                parcelas: parcelas
        ] as JSON)
    }



    def registrarPagamento(Long creditoId, Long parcelaId) {
        log.info("=" * 50)
        log.info("REGISTRAR PAGAMENTO")
        log.info("Crédito ID: ${creditoId}")
        log.info("Parcela ID: ${parcelaId}")
        log.info("Body: ${request.JSON}")
        log.info("=" * 50)

        // CORRIGIDO: Usar credito em vez de creditoId
        def credito = Credito.get(creditoId)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        def parcela = Parcela.findByIdAndCredito(parcelaId, credito)
        if (!parcela) {
            render status: 404, text: [message: "Parcela não encontrada"] as JSON
            return
        }

        if (parcela.pago) {
            render status: 400, text: [message: "Parcela já foi paga"] as JSON
            return
        }

        def data = request.JSON
        try {
            creditoService.registrarPagamento(
                    parcela,
                    data.valorPago as BigDecimal,
                    data.formaPagamento as String,
                    data.comprovativo as String
            )
            render status: 200, text: [message: "Pagamento registrado com sucesso"] as JSON
        } catch (Exception e) {
            log.error("Erro ao registrar pagamento: ${e.message}", e)
            render status: 500, text: [message: "Erro ao registrar pagamento: ${e.message}"] as JSON
        }
    }

    def recalcularTodos() {
        try {
            def resultado = creditoService.recalcularTodosCreditos()
            render status: 200, text: resultado as JSON
        } catch (Exception e) {
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    def recalcular(Long id) {
        def credito = Credito.get(id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }
        try {
            creditoService.recalcularTotais(credito)
            render status: 200, text: [
                    message: "Crédito recalculado!",
                    id: credito.id,
                    numero: credito.numero
            ] as JSON
        } catch (Exception e) {
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    // ====================================================================
    // MÉTODOS AUXILIARES PRIVADOS
    // ====================================================================

    private String gerarNumeroCredito() {
        Calendar cal = Calendar.getInstance()
        String ano = cal.get(Calendar.YEAR).toString()
        String mes = (cal.get(Calendar.MONTH) + 1).toString().padLeft(2, '0')
        long sequencial = Credito.count() + 1
        return "CRED-${ano}${mes}-${String.format('%06d', sequencial)}"
    }
}