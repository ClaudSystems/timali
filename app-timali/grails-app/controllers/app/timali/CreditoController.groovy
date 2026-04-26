package app.timali

import grails.gorm.transactions.Transactional
import grails.converters.JSON
import java.math.RoundingMode



class CreditoController {

    static responseFormats = ['json']

    CreditoService creditoService

    // ====================================================================
    // CRUD Básico
    // ====================================================================

    // GET /api/creditos
    // CreditoController.groovy
    // CreditoController.groovy
    // Dentro do CreditoController.groovy, adicione:

/**
 * POST /api/creditos/recalcular-todos
 * Recalcula os totais de todos os créditos
 */
    def recalcularTodos() {
        try {
            def resultado = creditoService.recalcularTodosCreditos()
            render status: 200, text: [
                    message: "Recálculo concluído!",
                    atualizados: resultado.atualizados,
                    comErro: resultado.comErro,
                    total: resultado.total
            ] as JSON
        } catch (Exception e) {
            log.error("Erro ao recalcular: ${e.message}", e)
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

/**
 * PUT /api/creditos/{id}/recalcular
 * Recalcula os totais de um crédito específico
 */
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
                    numero: credito.numero,
                    totalPrevisto: credito.totalPrevisto,
                    totalPago: credito.totalPago,
                    totalEmDivida: credito.totalEmDivida
            ] as JSON
        } catch (Exception e) {
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }
    // CreditoController.groovy - método index() CORRIGIDO
    def index() {
        def max = params.max ? params.int('max') : 20
        def offset = params.offset ? params.int('offset') : 0

        def creditos = Credito.list(max: max, offset: offset, sort: 'dataEmissao', order: 'desc')

        def sdf = new java.text.SimpleDateFormat('yyyy-MM-dd')
        def safeEnum = { val -> try { return val?.toString() } catch (e) { return null } }
        def safeDate = { data -> try { return sdf.format(data) } catch (e) { return null } }
        def safeDecimal = { val -> try { return (val ?: 0.0) as BigDecimal } catch (e) { return 0.0 } }

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

                // Entidade segura
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
    // CreditoController.groovy
    // CreditoController.groovy
    // CreditoController.groovy

    def mostrar() {
        Long id = params.long('id')

        try {
            def credito = Credito.get(id)
            if (!credito) {
                render status: 404, text: [message: "Crédito não encontrado"] as JSON
                return
            }

            // Funções ultra-seguras
            def safeEnum = { val ->
                try { return val?.toString() } catch (e) { return null }
            }
            def safeDate = { data ->
                try { return data?.format('yyyy-MM-dd') } catch (e) { return null }
            }
            def safeDecimal = { val ->
                try { return (val ?: 0.0) as BigDecimal } catch (e) { return 0.0 }
            }

            // CORREÇÃO: Acessar definicaoCredito de forma segura
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

            // CORREÇÃO: Acessar entidade de forma segura
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

            // CORREÇÃO: Acessar usuario de forma segura
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

            // Parcelas com segurança
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

    // ========== ENUM DA PARCELA CONVERTIDO PARA STRING ==========


    @Transactional
    def save() {
        def data = request.JSON
        criarCredito(data)
    }


    @Transactional
    def criarCreditoAction() {
        println "=" * 50
        println ">>> MÉTODO criarCreditoAction <<<"
        println "=" * 50

        def data = request.JSON
        println "Dados recebidos: ${data}"

        criarCredito(data)
    }

    // PUT /api/creditos/{id}
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

    // PATCH /api/creditos/{id}
    @Transactional
    def patch() {
        update()
    }

    // DELETE /api/creditos/{id}
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
    // Métodos Customizados
    // ====================================================================

    // POST /api/creditos/criar
   /* @Transactional
    def criar() {
        println "=" * 50
        println "CRIAR CRÉDITO - Método criar()"
        println "Request JSON: ${request.JSON}"
        println "=" * 50

        def data = request.JSON
        criarCredito(data)
    }*/

    // Método auxiliar para criar crédito
    private def criarCredito(data) {
        println "=" * 50
        println "CRIANDO CRÉDITO"
        println "Dados recebidos: ${data}"
        println "=" * 50

        try {
            // 1. Validar campos obrigatórios
            if (!data.entidadeId) {
                println "ERRO: entidadeId não informado"
                render status: 400, text: [message: "Cliente é obrigatório"] as JSON
                return
            }
            if (!data.definicaoCreditoId) {
                println "ERRO: definicaoCreditoId não informado"
                render status: 400, text: [message: "Definição de crédito é obrigatória"] as JSON
                return
            }
            if (!data.valorConcedido) {
                println "ERRO: valorConcedido não informado"
                render status: 400, text: [message: "Valor concedido é obrigatório"] as JSON
                return
            }

            // 2. Buscar entidade
            println "1. Buscando entidade ID: ${data.entidadeId}"
            Entidade entidade = Entidade.get(data.entidadeId as Long)
            if (!entidade) {
                println "ERRO: Entidade não encontrada"
                render status: 404, text: [message: "Cliente não encontrado"] as JSON
                return
            }
            println "   Entidade encontrada: ${entidade.nome}"

            // 3. Buscar definição
            println "2. Buscando definição ID: ${data.definicaoCreditoId}"
            DefinicaoCredito definicao = DefinicaoCredito.get(data.definicaoCreditoId as Long)
            if (!definicao) {
                println "ERRO: Definição não encontrada"
                render status: 404, text: [message: "Definição de crédito não encontrada"] as JSON
                return
            }
            println "   Definição encontrada: ${definicao.nome}"

            // 4. Buscar usuário
            println "3. Buscando usuário"
            def usuario = Usuario.findByUsername('admin')
            if (!usuario) {
                usuario = Usuario.list()?.first()
            }
            if (!usuario) {
                println "ERRO: Nenhum usuário encontrado"
                render status: 500, text: [message: "Usuário não encontrado"] as JSON
                return
            }
            println "   Usuário: ${usuario.username}"

            // 5. Criar objeto Credito
            println "4. Criando objeto Credito"
            Credito credito = new Credito()
            credito.entidade = entidade
            credito.definicaoCredito = definicao
            credito.usuario = usuario
            credito.valorConcedido = data.valorConcedido as BigDecimal

            // 6. Configurar campos
            println "5. Configurando campos"
            credito.percentualDeJuros = (data.percentualDeJuros ?: definicao.percentualDeJuros) as BigDecimal
            credito.percentualJurosDeDemora = (data.percentualJurosDeDemora ?: definicao.percentualJurosDeDemora) as BigDecimal
            credito.numeroDePrestacoes = (data.numeroDePrestacoes ?: definicao.numeroDePrestacoes) as Integer

            // 7. Periodicidade
            println "6. Configurando periodicidade: ${data.periodicidade}"
            if (data.periodicidade) {
                try {
                    credito.periodicidade = Periodicidade.valueOf(data.periodicidade as String)
                } catch (Exception e) {
                    credito.periodicidade = definicao.periodicidade ?: Periodicidade.MENSAL
                }
            } else {
                credito.periodicidade = definicao.periodicidade ?: Periodicidade.MENSAL
            }
            println "   Periodicidade definida: ${credito.periodicidade}"

            // 8. Forma de cálculo
            println "7. Configurando forma de cálculo: ${data.formaDeCalculo}"
            if (data.formaDeCalculo) {
                try {
                    credito.formaDeCalculo = FormaCalculo.valueOf(data.formaDeCalculo as String)
                } catch (Exception e) {
                    credito.formaDeCalculo = definicao.formaDeCalculo ?: FormaCalculo.JUROS_SIMPLES
                }
            } else {
                credito.formaDeCalculo = definicao.formaDeCalculo ?: FormaCalculo.JUROS_SIMPLES
            }
            println "   Forma de cálculo definida: ${credito.formaDeCalculo}"

            // 9. Data de emissão
            // 8. Configurando data de emissão: ${data.dataEmissao}
            println "8. Configurando data de emissão: ${data.dataEmissao}"
            if (data.dataEmissao) {
                try {
                    credito.dataEmissao = Date.parse('yyyy-MM-dd', data.dataEmissao.toString())
                } catch (Exception e) {
                    println "Erro ao parsear data, usando data atual: ${e.message}"
                    credito.dataEmissao = new Date()
                }
            } else {
                credito.dataEmissao = new Date()
            }
            println "   Data emissão: ${credito.dataEmissao}"

            // 10. Outros campos
            credito.numero = gerarNumeroCredito()
            credito.descricao = data.descricao
            credito.ignorarPagamentosNoPrazo = data.ignorarPagamentosNoPrazo ?: false
            credito.criadoPor = usuario.username
            credito.status = StatusCredito.ATIVO
            credito.ativo = true

            println "9. Validando crédito"
            if (!credito.validate()) {
                println "ERRO de validação:"
                credito.errors.allErrors.each { error ->
                    println "   - ${error.field}: ${error.defaultMessage}"
                }
                render status: 422, text: [errors: credito.errors] as JSON
                return
            }

            // 11. Salvar crédito
            println "10. Salvando crédito"
            credito.save(flush: true)
            println "    Crédito salvo. ID: ${credito.id}"

            // 12. Gerar parcelas
            println "11. Gerando parcelas"
            creditoService.gerarParcelas(credito)
            println "    Parcelas geradas com sucesso"

            println "=" * 50
            println "CRÉDITO CRIADO COM SUCESSO!"
            println "ID: ${credito.id}"
            println "Número: ${credito.numero}"
            println "=" * 50

            render status: 201, text: [
                    id: credito.id,
                    numero: credito.numero,
                    message: "Crédito criado com sucesso"
            ] as JSON

        } catch (Exception e) {
            println "=" * 50
            println "EXCEÇÃO NO CRÉDITO CONTROLLER"
            println "=" * 50
            println "Mensagem: ${e.message}"
            println "Causa: ${e.cause}"
            e.printStackTrace()
            println "=" * 50
            render status: 500, text: [message: "Erro interno: ${e.message}"] as JSON
        }
    }

    // GET /api/creditos/buscar-clientes
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
                    documento: cliente.numero_de_identificao ?: cliente.nuit ?: ''
            ]
        }

        render(resultado as JSON)
    }

// CreditoController.groovy
    def parcelas(Long creditoId) {
        println "=" * 50
        println "MÉTODO parcelas() - creditoId: ${creditoId}"
        println "=" * 50

        def credito = Credito.get(creditoId)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        try {
            // Função para extrair valor de enum
            def extrairEnum = { val -> val?.toString() ?: null }

            // Função para formatar data
            def formatarData = { data ->
                if (!data) return null
                try {
                    def date = data instanceof java.sql.Timestamp ? new Date(data.time) : data
                    return date.format('yyyy-MM-dd')
                } catch (Exception e) {
                    return data.toString()
                }
            }

            def parcelas = credito.parcelas?.sort { it.numero }?.collect { parcela ->
                [
                        id: parcela.id,
                        numero: parcela.numero,
                        descricao: parcela.descricao,
                        dataVencimento: formatarData(parcela.dataVencimento),
                        dataPagamento: formatarData(parcela.dataPagamento),
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
                        // ENUM convertido para string
                        status: extrairEnum(parcela.status),
                        formaPagamento: parcela.formaPagamento,
                        comprovativo: parcela.comprovativo,
                        observacao: parcela.observacao,
                        cobrancasMoraAplicadas: parcela.cobrancasMoraAplicadas
                ]
            } ?: []

            println "Parcelas encontradas: ${parcelas.size()}"

            render parcelas as JSON

        } catch (Exception e) {
            println "ERRO no parcelas(): ${e.message}"
            e.printStackTrace()
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    // PUT /api/creditos/{id}/invalidar
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
        credito.atualizadoPor = request.usuario?.username ?: 'sistema'
        credito.save(flush: true)

        render status: 200, text: [message: "Crédito invalidado com sucesso"] as JSON
    }

    // PUT /api/creditos/{id}/arquivar
    @Transactional
    def arquivar(Long id) {
        def credito = Credito.get(id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        credito.ativo = false
        credito.atualizadoPor = request.usuario?.username ?: 'sistema'
        credito.save(flush: true)

        render status: 200, text: [message: "Crédito arquivado com sucesso"] as JSON
    }

    // GET /api/creditos/{id}/extrato





    def extrato(Long id) {
        def credito = Credito.get(id)
        if (!credito) {
            render status: 404, text: [message: "Crédito não encontrado"] as JSON
            return
        }

        def parcelas = credito.parcelas?.sort { it.numero }?.collect { [
                numero: it.numero,
                dataVencimento: it.dataVencimento?.format('yyyy-MM-dd'),
                valorParcela: it.valorParcela,
                valorAmortizacao: it.valorAmortizacao,
                valorJuros: it.valorJuros,
                valorMulta: it.valorMulta,
                valorJurosDemora: it.valorJurosDemora,
                valorPago: it.valorPago,
                saldoDevedor: it.saldoDevedor,
                pago: it.pago,
                status: it.status?.toString()
        ] } ?: []

        // Totais agregados
        BigDecimal totalParcelas = parcelas.sum { it.valorParcela ?: 0.0 } ?: 0.0
        BigDecimal totalAmortizacao = parcelas.sum { it.valorAmortizacao ?: 0.0 } ?: 0.0
        BigDecimal totalJuros = parcelas.sum { it.valorJuros ?: 0.0 } ?: 0.0
        BigDecimal totalMulta = parcelas.sum { it.valorMulta ?: 0.0 } ?: 0.0
        BigDecimal totalJurosDemora = parcelas.sum { it.valorJurosDemora ?: 0.0 } ?: 0.0
        BigDecimal totalPago = parcelas.sum { it.valorPago ?: 0.0 } ?: 0.0

        def totais = [
                totalPrevisto: totalParcelas.setScale(2, RoundingMode.HALF_UP),
                totalAmortizacao: totalAmortizacao.setScale(2, RoundingMode.HALF_UP),
                totalJuros: totalJuros.setScale(2, RoundingMode.HALF_UP),
                totalMulta: totalMulta.setScale(2, RoundingMode.HALF_UP),
                totalJurosDemora: totalJurosDemora.setScale(2, RoundingMode.HALF_UP),
                totalPago: totalPago.setScale(2, RoundingMode.HALF_UP),
                saldoPendente: (totalParcelas - totalPago).setScale(2, RoundingMode.HALF_UP)
        ]

        render([
                credito: [
                        id: credito.id,
                        numero: credito.numero,
                        entidade: credito.entidade?.nome,
                        valorConcedido: credito.valorConcedido,
                        valorTotal: credito.valorTotal,
                        status: credito.status?.toString(),
                        dataEmissao: credito.dataEmissao?.format('yyyy-MM-dd')
                ],
                parcelas: parcelas,
                totais: totais
        ] as JSON)
    }



    // POST /api/creditos/{creditoId}/parcelas/{parcelaId}/pagar
    @Transactional
    def registrarPagamento(Long creditoId, Long parcelaId) {
        def parcela = Parcela.findByIdAndCreditoId(parcelaId, creditoId)
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

            render status: 200, text: [
                    message: "Pagamento registrado com sucesso",
                    parcela: [
                            id: parcela.id,
                            numero: parcela.numero,
                            pago: parcela.pago,
                            valorPago: parcela.valorPago
                    ]
            ] as JSON
        } catch (Exception e) {
            render status: 500, text: [message: "Erro ao registrar pagamento: ${e.message}"] as JSON
        }
    }

    // ====================================================================
    // Métodos Auxiliares
    // ====================================================================

    private String gerarNumeroCredito() {
        Calendar cal = Calendar.getInstance()
        String ano = cal.get(Calendar.YEAR).toString()
        String mes = (cal.get(Calendar.MONTH) + 1).toString().padLeft(2, '0')
        long sequencial = Credito.count() + 1
        return "CRED-${ano}${mes}-${String.format('%06d', sequencial)}"
    }
}