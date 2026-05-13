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

    // CreditoController.groovy

    // CreditoController.groovy - relatorioPagamentos

    // CreditoController.groovy

/**
 * Buscar recibos/pagamentos por período de PAGAMENTO
 */
    def recibosPorPeriodo() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
        sdf.setLenient(false)

        Date dataInicio, dataFim

        try {
            dataInicio = params.dataInicio ? sdf.parse(params.dataInicio as String) : (new Date() - 30)
            dataFim = params.dataFim ? sdf.parse(params.dataFim as String) : new Date()
        } catch (Exception e) {
            render status: 400, text: [message: "Formato de data inválido"] as JSON
            return
        }

        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        // Buscar parcelas PAGAS filtrando por DATA DE PAGAMENTO
        def parcelas = Parcela.createCriteria().list {
            eq('pago', true)
            between('dataPagamento', dataInicio, dataFimAjustada)
            order('dataPagamento', 'desc')
            maxResults(500)
        }

        def resultado = parcelas.collect { parcela ->
            try {
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
                        creditoId: parcela.credito?.id,
                        creditoNumero: parcela.credito?.numero,
                        cliente: parcela.credito?.entidade?.nome,
                        nuit: parcela.credito?.entidade?.identificacao?.nuit,
                        telefone: parcela.credito?.entidade?.contacto?.telefone1 ?: '',
                        documento: parcela.credito?.entidade?.identificacao?.numeroDeIdentificao,
                        saldoDevedor: parcela.credito?.totalEmDivida
                ]
            } catch (Exception e) {
                println "⚠️ Erro ao processar parcela ${parcela.id}: ${e.message}"
                null
            }
        }.findAll { it != null }

        render(resultado as JSON)
    }

    def relatorioPagamentos() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
        SimpleDateFormat sdfDisplay = new SimpleDateFormat("dd/MM/yyyy")
        SimpleDateFormat sdfDateTime = new SimpleDateFormat("dd/MM/yyyy HH:mm")
        sdf.setLenient(false)

        Date dataInicio, dataFim

        try {
            dataInicio = params.dataInicio ? sdf.parse(params.dataInicio as String) : (new Date() - 30)
            dataFim = params.dataFim ? sdf.parse(params.dataFim as String) : new Date()
        } catch (Exception e) {
            render status: 400, text: [message: "Formato de data inválido"] as JSON
            return
        }

        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        def parcelas = Parcela.createCriteria().list {
            between('dataVencimento', dataInicio, dataFimAjustada)
            order('dataVencimento', 'asc')
        }

        // CORRIGIDO: Converter Timestamp para Date antes de formatar
        def resultado = parcelas.collect { parcela ->
            // Função segura para formatar data
            def formatarData = { java.util.Date d, String formato ->
                if (!d) return ""
                try {
                    // Converter para java.util.Date se for Timestamp
                    Date date = d instanceof java.sql.Timestamp ? new Date(d.time) : d
                    return new SimpleDateFormat(formato).format(date)
                } catch (Exception ex) {
                    return d.toString()
                }
            }

            [
                    id: parcela.id,
                    numeroParcela: parcela.numero,
                    dataVencimento: formatarData(parcela.dataVencimento, "dd/MM/yyyy"),
                    dataPagamento: formatarData(parcela.dataPagamento, "dd/MM/yyyy HH:mm"),
                    valorParcela: parcela.valorParcela,
                    valorPago: parcela.valorPago ?: 0,
                    pago: parcela.pago,
                    formaPagamento: parcela.formaPagamento,
                    comprovativo: parcela.comprovativo,
                    pagoNoPrazo: parcela.pagoNoPrazo,
                    clienteNome: parcela.credito?.entidade?.nome,
                    clienteTelefone: parcela.credito?.entidade?.contacto?.telefone1 ?: '',
                    clienteNuit: parcela.credito?.entidade?.identificacao?.nuit,
                    creditoNumero: parcela.credito?.numero,
                    saldoDevedor: parcela.credito?.totalEmDivida
            ]
        }

        BigDecimal totalPago = resultado.sum { it.valorPago ?: 0 }

        def totalPorForma = [:]
        resultado.groupBy { it.formaPagamento ?: 'OUTRO' }.each { forma, lista ->
            totalPorForma[forma] = [
                    quantidade: lista.size(),
                    valorTotal: lista.sum { it.valorPago ?: 0 }
            ]
        }

        def resposta = [
                periodo: [
                        dataInicio: sdfDisplay.format(dataInicio),
                        dataFim: sdfDisplay.format(dataFim)
                ],
                totalParcelas: resultado.size(),
                totalPago: totalPago,
                totalPorForma: totalPorForma,
                parcelas: resultado
        ]

        render(resposta as JSON)
    }

    def buscarPagamentosPorCredito(Long creditoId) {
        def entidade = Entidade.findById(params.id, [fetch: [identificacao: 'join', contacto: 'join', dadosPessoais: 'join']])
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
                    nuit: credito.entidade?.identificacao?.nuit,
                    documento: credito.entidade?.identificacao?.numeroDeIdentificao,
                    saldoDevedor: credito.totalEmDivida
            ]
        }

        render(resultado as JSON)
    }

    // Buscar pagamentos/histórico de uma parcela específica (para múltiplos pagamentos parciais)
    def pagamentosParcela(Long parcelaId) {
        try {
            println "🔍 Buscando pagamentos da parcela: ${parcelaId}"
            
            def parcela = Parcela.get(parcelaId)
            if (!parcela) {
                println "❌ Parcela não encontrada"
                render status: 404, text: [message: "Parcela não encontrada"] as JSON
                return
            }

            // Se a parcela tem histórico de pagamentos (tabela Pagamento)
            def pagamentos = []
            try {
                // Tenta buscar na tabela Pagamento se existir
                pagamentos = Pagamento.findAllByParcela(parcela, [sort: 'dataPagamento', order: 'desc'])
                    .collect { pag ->
                        [
                            id: pag.id,
                            dataPagamento: pag.dataPagamento,
                            valorPago: pag.valorPago,
                            formaPagamento: pag.formaPagamento,
                            comprovativo: pag.comprovativo,
                            numeroRecibo: pag.numeroRecibo,
                            observacao: pag.observacao
                        ]
                    }
            } catch (Exception e) {
                println "⚠️ Tabela Pagamento não disponível, usando dados da parcela"
                // Fallback: se a parcela está paga, retorna um único pagamento com os dados dela
                if (parcela.pago || (parcela.valorPago ?: 0) > 0) {
                    pagamentos = [[
                        id: parcela.id,
                        dataPagamento: parcela.dataPagamento ?: new Date(),
                        valorPago: parcela.valorPago ?: 0,
                        formaPagamento: parcela.formaPagamento ?: 'DINHEIRO',
                        comprovativo: parcela.comprovativo,
                        numeroRecibo: parcela.numeroRecibo ?: "REC-${parcela.id}",
                        observacao: parcela.observacao
                    ]]
                }
            }

            println "✅ Encontrados ${pagamentos.size()} pagamento(s)"
            render(pagamentos as JSON)
        } catch (Exception e) {
            println "❌ ERRO ao buscar pagamentos: ${e.message}"
            e.printStackTrace()
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }
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
                    nuit: parcela.credito?.entidade?.identificacao?.nuit,
                    documento: parcela.credito?.entidade?.identificacao?.numeroDeIdentificao,
                    saldoDevedor: parcela.credito?.totalEmDivida
            ]
        }

        render(resultado as JSON)
    }

// Buscar pagamentos por período
    // CreditoController.groovy

    // CreditoController.groovy

    // CreditoController.groovy

    def parcelasVencidasNoPeriodo() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
        sdf.setLenient(false)

        Date dataInicio
        Date dataFim

        try {
            if (params.dataInicio) {
                dataInicio = sdf.parse(params.dataInicio as String)
            } else {
                Calendar cal = Calendar.getInstance()
                cal.add(Calendar.DAY_OF_MONTH, -30)
                dataInicio = cal.getTime()
            }

            if (params.dataFim) {
                dataFim = sdf.parse(params.dataFim as String)
            } else {
                dataFim = new Date()
            }
        } catch (Exception e) {
            render status: 400, text: [message: "Formato de data inválido. Use yyyy-MM-dd"] as JSON
            return
        }

        // Ajustar dataFim para incluir o dia inteiro
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        // Buscar parcelas com VENCIMENTO no período
        def parcelas = Parcela.createCriteria().list {
            between('dataVencimento', dataInicio, dataFimAjustada)
            order('dataVencimento', 'asc')
            maxResults(500)
        }

        def resultado = parcelas.collect { parcela ->
            try {
                [
                        id: parcela.id,
                        numero: parcela.numero,
                        dataVencimento: parcela.dataVencimento,
                        dataPagamento: parcela.dataPagamento,
                        valorParcela: parcela.valorParcela,
                        valorPago: parcela.valorPago ?: 0,
                        pago: parcela.pago,
                        pagoNoPrazo: parcela.pagoNoPrazo,
                        emMora: parcela.emMora,
                        status: parcela.status?.toString(),
                        formaPagamento: parcela.formaPagamento,
                        comprovativo: parcela.comprovativo,
                        diasAtraso: parcela.diasAtraso,
                        creditoId: parcela.credito?.id,
                        creditoNumero: parcela.credito?.numero,
                        cliente: parcela.credito?.entidade?.nome,
                        nuit: parcela.credito?.entidade?.identificacao?.nuit,
                        telefone: parcela.credito?.entidade?.contacto?.telefone1 ?: '',
                        documento: parcela.credito?.entidade?.identificacao?.numeroDeIdentificao,
                        saldoDevedor: parcela.credito?.totalEmDivida,
                        valorTotalCredito: parcela.credito?.valorTotal
                ]
            } catch (Exception e) {
                println "⚠️ Erro ao processar parcela ${parcela.id}: ${e.message}"
                null
            }
        }.findAll { it != null }

        render(resultado as JSON)
    }


    def pagamentosPorPeriodo() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
        sdf.setLenient(false)

        Date dataInicio
        Date dataFim

        try {
            dataInicio = params.dataInicio ? sdf.parse(params.dataInicio as String) : (new Date() - 30)
            dataFim = params.dataFim ? sdf.parse(params.dataFim as String) : new Date()
        } catch (Exception e) {
            render status: 400, text: [message: "Formato de data inválido"] as JSON
            return
        }

        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        // Buscar parcelas com VENCIMENTO no período que já foram PAGAS
        def parcelas = Parcela.createCriteria().list {
            eq('pago', true)
            between('dataVencimento', dataInicio, dataFimAjustada)
            order('dataVencimento', 'asc')
            maxResults(500)
        }

        def resultado = parcelas.collect { parcela ->
            try {
                [
                        id: parcela.id,
                        numero: parcela.numero,
                        dataVencimento: parcela.dataVencimento,
                        dataPagamento: parcela.dataPagamento,
                        valorParcela: parcela.valorParcela,
                        valorPago: parcela.valorPago,
                        formaPagamento: parcela.formaPagamento,
                        comprovativo: parcela.comprovativo,
                        pagoNoPrazo: parcela.pagoNoPrazo,
                        creditoId: parcela.credito?.id,
                        creditoNumero: parcela.credito?.numero,
                        cliente: parcela.credito?.entidade?.nome,
                        nuit: parcela.credito?.entidade?.identificacao?.nuit,
                        telefone: parcela.credito?.entidade?.contacto?.telefone1 ?: '',
                        documento: parcela.credito?.entidade?.identificacao?.numeroDeIdentificao,
                        saldoDevedor: parcela.credito?.totalEmDivida
                ]
            } catch (Exception e) {
                println "⚠️ Erro ao processar parcela ${parcela.id}: ${e.message}"
                null
            }
        }.findAll { it != null }

        render(resultado as JSON)
    }
    def index() {
        def max = params.max ? params.int('max') : 20
        def offset = params.offset ? params.int('offset') : 0

        def creditos = Credito.list(max: max, offset: offset, sort: 'dataEmissao', order: 'desc')
        // ===== CALCULAR MORAS PARA TODOS OS CRÉDITOS DA LISTA =====
        creditos.each { creditoService.calcularMorasAntesDeExibir(it) }
        creditos.each { creditoService.recalcularTotais(it) }
        // ==========================================================

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
            println "🔍 Buscando crédito ID: ${id}"
            
            def credito = Credito.findById(params.id, [
                    fetch: [
                            'entidade': 'join'
                    ]
            ])
            
            if (!credito) {
                println "❌ Crédito não encontrado"
                render status: 404, text: [message: "Crédito não encontrado"] as JSON
                return
            }
            
            println "✅ Crédito encontrado: ${credito.numero}"
           
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
                println "⚠️ Erro ao carregar definição: ${e.message}"
                log.warn("DefinicaoCredito não encontrada para crédito ${id}: ${e.message}")
                definicaoCreditoData = [id: null, nome: 'Definição removida']
            }

            // Entidade - carregamento seguro
            def entidadeData = null
            try {
                if (credito.entidade) {
                    entidadeData = [
                            id: credito.entidade?.id,
                            nome: credito.entidade?.nome,
                            codigo: credito.entidade?.codigo,
                            nuit: credito.entidade?.identificacao?.nuit,
                            numeroDeIdentificao: credito.entidade?.identificacao?.numeroDeIdentificao
                    ]
                }
            } catch (Exception e) {
                println "⚠️ Erro ao carregar entidade: ${e.message}"
                log.warn("Entidade não encontrada para crédito ${id}: ${e.message}")
                entidadeData = [id: null, nome: 'N/A', codigo: '', nuit: '']
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
                println "⚠️ Erro ao carregar usuário: ${e.message}"
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
                        println "⚠️ Erro na parcela ${p?.id}: ${e.message}"
                        log.error("Erro na parcela ${p?.id}: ${e.message}")
                    }
                }
            } catch (e) {
                println "⚠️ Erro ao acessar parcelas: ${e.message}"
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
                    totalPrevisto: credito.totalPrevisto,
                    totalPago: credito.totalPago,         // ← DIRETO na raiz
                    totalEmDivida: credito.totalEmDivida,

            ]

            println "✅ Renderizando resultado"
            render result as JSON

        } catch (Exception e) {
            println "❌ ERRO CRÍTICO: ${e.message}"
            e.printStackTrace()
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

    private def criarCredito(data) {

        println "=" * 50
        println "CRIANDO CRÉDITO"
        println "=" * 50

        // Data de emissão


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
                    // Converte para maiúsculas para garantir compatibilidade com o enum
                    def periodicidadeStr = (data.periodicidade as String).toUpperCase()
                    credito.periodicidade = Periodicidade.valueOf(periodicidadeStr)
                } catch (Exception e) {
                    println "⚠️ Erro ao converter periodicidade '${data.periodicidade}': ${e.message}"
                    // Se falhar, tenta converter do enum da definição
                    try {
                        def perDef = definicao.periodicidade
                        if (perDef) {
                            credito.periodicidade = Periodicidade.valueOf(perDef.toString().toUpperCase())
                        } else {
                            credito.periodicidade = Periodicidade.MENSAL
                        }
                    } catch (Exception e2) {
                        println "⚠️ Erro ao usar periodicidade da definição: ${e2.message}"
                        credito.periodicidade = Periodicidade.MENSAL
                    }
                }
            } else {
                // Usar periodicidade da definição
                try {
                    def perDef = definicao.periodicidade
                    if (perDef) {
                        credito.periodicidade = Periodicidade.valueOf(perDef.toString().toUpperCase())
                    } else {
                        credito.periodicidade = Periodicidade.MENSAL
                    }
                } catch (Exception e) {
                    println "⚠️ Erro ao usar periodicidade da definição: ${e.message}"
                    credito.periodicidade = Periodicidade.MENSAL
                }
            }

            // Forma de cálculo
            if (data.formaDeCalculo) {
                try {
                    // Converte para maiúsculas para garantir compatibilidade com o enum
                    def formaCalculoStr = (data.formaDeCalculo as String).toUpperCase()
                    credito.formaDeCalculo = FormaCalculo.valueOf(formaCalculoStr)
                } catch (Exception e) {
                    println "⚠️ Erro ao converter formaDeCalculo '${data.formaDeCalculo}': ${e.message}"
                    // Se falhar, tenta converter do enum da definição
                    try {
                        def formaDef = definicao.formaDeCalculo
                        if (formaDef) {
                            credito.formaDeCalculo = FormaCalculo.valueOf(formaDef.toString().toUpperCase())
                        } else {
                            credito.formaDeCalculo = FormaCalculo.JUROS_SIMPLES
                        }
                    } catch (Exception e2) {
                        println "⚠️ Erro ao usar formaDeCalculo da definição: ${e2.message}"
                        credito.formaDeCalculo = FormaCalculo.JUROS_SIMPLES
                    }
                }
            } else {
                // Usar forma de calculo da definição
                try {
                    def formaDef = definicao.formaDeCalculo
                    if (formaDef) {
                        credito.formaDeCalculo = FormaCalculo.valueOf(formaDef.toString().toUpperCase())
                    } else {
                        credito.formaDeCalculo = FormaCalculo.JUROS_SIMPLES
                    }
                } catch (Exception e) {
                    println "⚠️ Erro ao usar formaDeCalculo da definição: ${e.message}"
                    credito.formaDeCalculo = FormaCalculo.JUROS_SIMPLES
                }
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

    // ====================================================================
    // MÉTODO AUXILIAR PARA CRIAR CRÉDITO
    // ====================================================================

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
    // ENDPOINTS CUSTOMIZADOS
    // ====================================================================
    // grails-app/controllers/app/timali/CreditoController.groovy

    def buscarCreditosPorCliente() {
        String termo = params.termo
        if (!termo || termo.length() < 2) {
            render([] as JSON)
            return
        }

        try {
            println "🔍 Buscando créditos por termo: ${termo}"
            
            // Usar HQL em vez de Criteria para evitar problemas de alias
            def creditos = Credito.executeQuery(
                """SELECT DISTINCT c FROM Credito c 
                   LEFT JOIN FETCH c.entidade e 
                   LEFT JOIN FETCH e.identificacao i
                   WHERE LOWER(c.numero) LIKE LOWER(:termo) 
                   OR LOWER(e.nome) LIKE LOWER(:termo) 
                   OR LOWER(e.codigo) LIKE LOWER(:termo)
                   OR LOWER(i.nuit) LIKE LOWER(:termo)
                   ORDER BY c.dataEmissao DESC""",
                [termo: "%${termo}%"],
                [max: 20]
            )

            println "✅ Créditos encontrados: ${creditos?.size()}"

            def resultado = creditos.collect { credito ->
                try {
                    [
                            id: credito.id,
                            numero: credito.numero,
                            cliente: credito.entidade?.nome,
                            codigo: credito.entidade?.codigo,
                            nuit: credito.entidade?.identificacao?.nuit,
                            documento: credito.entidade?.identificacao?.numeroDeIdentificao ?: credito.entidade?.identificacao?.nuit ?: '',
                            valorTotal: credito.valorTotal ?: 0,
                            totalPago: credito.totalPago ?: 0,
                            totalEmDivida: credito.totalEmDivida ?: 0,
                            saldo: credito.totalEmDivida ?: 0,
                            status: credito.status?.toString() ?: 'ATIVO',
                            ativo: credito.ativo != false,
                            dataEmissao: credito.dataEmissao
                    ]
                } catch (Exception e) {
                    println "⚠️ Erro ao processar crédito ${credito.id}: ${e.message}"
                    null
                }
            }.findAll { it != null }

            println "✅ Resultado final: ${resultado?.size()} créditos"
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ ERRO em buscarCreditosPorCliente: ${e.message}"
            e.printStackTrace()
            render status: 500, text: [message: "Erro interno: ${e.message}"] as JSON
        }
    }

    def buscarClientes() {
        String termo = params.termo
        if (!termo || termo.length() < 2) {
            render([] as JSON)
            return
        }

        try {
            println "🔍 Buscando clientes por termo: ${termo}"
            
            def clientes = Entidade.createCriteria().list {
                or {
                    ilike('codigo', "%${termo}%")
                    ilike('nome', "%${termo}%")
                }
                maxResults(20)
                order('nome', 'asc')
            }

            println "✅ Clientes encontrados: ${clientes?.size()}"

            def resultado = clientes.collect { cliente ->
                try {
                    [
                            id: cliente.id,
                            codigo: cliente.codigo,
                            nome: cliente.nome,
                            documento: cliente.identificacao?.numeroDeIdentificao ?: cliente.identificacao?.nuit ?: ''
                    ]
                } catch (Exception e) {
                    println "⚠️ Erro ao processar cliente ${cliente.id}: ${e.message}"
                    null
                }
            }.findAll { it != null }

            println "✅ Resultado final: ${resultado?.size()} clientes"
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ ERRO em buscarClientes: ${e.message}"
            e.printStackTrace()
            render status: 500, text: [message: "Erro interno: ${e.message}"] as JSON
        }
    }

    // ====================================================================
    // SIMULADOR DE CRÉDITO
    // ====================================================================

    /**
     * Simula um crédito baseado em uma definição e parâmetros fornecidos
     * POST /api/creditos/simulacao
     */
    @Transactional(readOnly = true)
    def simulacao() {
        try {
            println "🧮 Endpoint SIMULACAO chamado"
            println "   Content-Type: ${request.contentType}"
            println "   Method: ${request.method}"
            
            def json = request.JSON
            println "   JSON recebido: ${json}"
            
            BigDecimal valorConcedido = json.valorConcedido as BigDecimal
            Long definicaoId = json.definicaoId as Long
            Integer numeroDePrestacoes = json.numeroDePrestacoes
            BigDecimal percentualDeJuros = json.percentualDeJuros as BigDecimal
            String formaDeCalculo = json.formaDeCalculo
            String periodicidade = json.periodicidade

            println "🧮 Simulação solicitada:"
            println "   Valor: ${valorConcedido}"
            println "   Definição ID: ${definicaoId}"

            if (!valorConcedido || valorConcedido <= 0) {
                render status: 400, text: [message: "Valor concedido inválido"] as JSON
                return
            }

            if (!definicaoId) {
                render status: 400, text: [message: "Definição de crédito obrigatória"] as JSON
                return
            }

            // Buscar definição
            def definicao = DefinicaoCredito.get(definicaoId)
            if (!definicao) {
                render status: 404, text: [message: "Definição não encontrada"] as JSON
                return
            }

            // Usar valores da definição se não foram fornecidos
            numeroDePrestacoes = numeroDePrestacoes ?: definicao.numeroDePrestacoes
            percentualDeJuros = percentualDeJuros != null ? percentualDeJuros : definicao.percentualDeJuros
            formaDeCalculo = formaDeCalculo ?: definicao.formaDeCalculo
            periodicidade = periodicidade ?: definicao.periodicidade

            println "   Prestações: ${numeroDePrestacoes}"
            println "   Juros: ${percentualDeJuros}%"
            println "   Forma: ${formaDeCalculo}"
            println "   Periodicidade: ${periodicidade}"

            // Calcular parcelas usando o service
            def resultado = creditoService.simularCredito(
                valorConcedido,
                numeroDePrestacoes,
                percentualDeJuros,
                formaDeCalculo,
                periodicidade
            )

            println "✅ Simulação concluída: ${resultado.parcelas?.size()} parcelas geradas"
            render status: 200, text: (resultado as JSON)
        } catch (Exception e) {
            println "❌ ERRO na simulação: ${e.message}"
            e.printStackTrace()
            render status: 500, text: [message: "Erro na simulação: ${e.message}"] as JSON
        }
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
            def credito = Credito.findById(params.id, [
        fetch: [
            'entidade': 'join',
            'entidade.identificacao': 'join',
            'entidade.contacto': 'join',
            'entidade.dadosPessoais': 'join'
        ]
    ])

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
            def credito = Credito.findById(params.id, [
        fetch: [
            'entidade': 'join',
            'entidade.identificacao': 'join',
            'entidade.contacto': 'join',
            'entidade.dadosPessoais': 'join'
        ]
    ])

        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }
        credito.ativo = false
        credito.save(flush: true)
        render status: 200, text: [message: "Crédito arquivado com sucesso"] as JSON
    }




// CreditoController.groovy - método registrarPagamento

    def extrato(Long id) {
        println ">>> MÉTODO extrato() CHAMADO - ID: ${id} <<<"

        def credito = Credito.findById(params.id, [
                fetch: [
                        'entidade': 'join',
                        'entidade.identificacao': 'join',
                        'entidade.contacto': 'join',
                        'entidade.dadosPessoais': 'join'
                ]
        ])
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        // Calcular moras atualizadas
        creditoService.calcularMorasAntesDeExibir(credito)

        def sdf = new java.text.SimpleDateFormat('dd/MM/yyyy')

        BigDecimal saldoAtual = credito.valorTotal ?: BigDecimal.ZERO
        BigDecimal totalMoras = BigDecimal.ZERO
        BigDecimal totalPago = BigDecimal.ZERO

        def linhasExtrato = []

        // Linha de concessão
        linhasExtrato << [
                dataEmissao: sdf.format(credito.dataEmissao),
                descricao: "Concessão de Crédito Nº ${credito.numero}",
                debito: 0.0,
                credito: credito.valorTotal ?: 0.0,
                valorEmMora: 0.0,
                jurosDeMora: 0.0,
                numeroDeMoras: 0,
                saldo: credito.valorTotal ?: 0.0
        ]

        // Linhas das parcelas
        credito.parcelas?.sort { it.numero }?.each { Parcela parcela ->
            String status = parcela.pago ? 'PAGA' : (parcela.dataVencimento < new Date() ? 'VENCIDA' : 'PENDENTE')
            BigDecimal valorParcela = parcela.valorParcela ?: BigDecimal.ZERO
            BigDecimal valorPago = parcela.valorPago ?: BigDecimal.ZERO
            BigDecimal mora = parcela.valorJurosDemora ?: BigDecimal.ZERO
            int numeroMoras = parcela.cobrancasMoraAplicadas ?: 0

            saldoAtual = saldoAtual.add(mora)
            totalMoras = totalMoras.add(mora)
            saldoAtual = saldoAtual.subtract(valorPago)
            totalPago = totalPago.add(valorPago)

            linhasExtrato << [
                    data: sdf.format(parcela.dataVencimento),
                    descricao: "${parcela.numero}ª Prestação ${status}",
                    debito: valorParcela,
                    credito: valorPago,
                    valorEmMora: mora,
                    jurosDeMora: mora,
                    numeroDeMoras: numeroMoras,
                    saldo: saldoAtual
            ]
        }

        def resultado = [
                credito: [
                        numero: credito.numero,
                        valorConcedido: credito.valorConcedido,
                        valorTotal: credito.valorTotal,
                        percentualDeJuros: credito.percentualDeJuros,
                        percentualJurosDeDemora: credito.percentualJurosDeDemora,
                        periodicidade: credito.periodicidade?.toString(),
                        formaDeCalculo: credito.formaDeCalculo?.toString(),
                        dataEmissao: sdf.format(credito.dataEmissao),
                        numeroDePrestacoes: credito.numeroDePrestacoes,
                        numeroDePrestacoesEmDia: credito.parcelas?.count { it.pago } ?: 0,
                        criadoPor: credito.criadoPor
                ],
                cliente: [
                        codigo: credito.entidade?.codigo,
                        nome: credito.entidade?.nome,
                        documento: credito.entidade?.identificacao?.numeroDeIdentificao ?: credito.entidade.identificacao?.nuit,
                        telefone: credito.entidade?.contacto?.telefone,
                            tipoDocumento: credito.entidade?.identificacao?.tipoDeIdentificao ?: 'BI'
                ],
                linhas: linhasExtrato,
                totais: [
                        totalDebito: 0.0,
                        totalCredito: credito.valorTotal ?: 0.0,
                        totalMoras: totalMoras,
                        totalJurosDeMora: totalMoras,
                        totalPago: totalPago,
                        totalEmMora: saldoAtual
                ]
        ]

        render resultado as JSON
    }

    def registrarPagamento(Long creditoId, Long parcelaId) {
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

        // NOVO: Verificar se tem data de pagamento personalizada
        Date dataPagamento = new Date()
        if (data.dataPagamento) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                sdf.setTimeZone(TimeZone.getTimeZone("UTC"))
                dataPagamento = sdf.parse(data.dataPagamento as String)
            } catch (Exception e) {
                try {
                    // Tentar formato sem timezone
                    SimpleDateFormat sdf2 = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS")
                    dataPagamento = sdf2.parse(data.dataPagamento as String)
                } catch (Exception ex) {
                    log.warn("Formato de data inválido: ${data.dataPagamento}, usando data atual")
                }
            }
        }

        try {
            creditoService.registrarPagamento(
                    parcela,
                    data.valorPago as BigDecimal,
                    data.formaPagamento as String,
                    data.comprovativo as String,
                    dataPagamento  // NOVO: Passar data de pagamento
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
            def credito = Credito.findById(params.id, [
        fetch: [
            'entidade': 'join',
            'entidade.identificacao': 'join',
            'entidade.contacto': 'join',
            'entidade.dadosPessoais': 'join'
        ]
    ])

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