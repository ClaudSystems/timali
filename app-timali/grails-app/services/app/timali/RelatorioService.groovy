// grails-app/services/app/timali/RelatorioService.groovy
package app.timali

import java.text.SimpleDateFormat

class RelatorioService {

    /**
     * Relatório de Créditos Emitidos num Período
     */
    def creditosEmitidosPorPeriodo(Date dataInicio, Date dataFim) {
        println "📊 Gerando relatório de créditos emitidos: ${dataInicio} até ${dataFim}"
        
        // Ajustar dataFim para incluir o dia inteiro
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        def creditos = Credito.createCriteria().list {
            between('dataEmissao', dataInicio, dataFimAjustada)
            eq('ativo', true)
            order('dataEmissao', 'desc')
        }

        def resultado = creditos.collect { credito ->
            [
                id: credito.id,
                numero: credito.numero,
                dataEmissao: credito.dataEmissao,
                entidadeNome: credito.entidade?.nome,
                entidadeCodigo: credito.entidade?.codigo,
                valorConcedido: credito.valorConcedido,
                valorTotal: credito.valorTotal,
                totalPago: credito.totalPago ?: 0,
                saldoDevedor: (credito.valorTotal ?: 0) - (credito.totalPago ?: 0),
                numeroDePrestacoes: credito.numeroDePrestacoes,
                periodicidade: credito.periodicidade?.toString(),
                formaDeCalculo: credito.formaDeCalculo?.toString(),
                status: credito.status?.toString(),
                criadoPor: credito.criadoPor
            ]
        }

        // Totais
        def totais = [
            totalCreditos: resultado.size(),
            valorTotalConcedido: resultado.sum { it.valorConcedido } ?: 0,
            valorTotalAPagar: resultado.sum { it.valorTotal } ?: 0,
            valorTotalPago: resultado.sum { it.totalPago } ?: 0,
            saldoTotalDevedor: resultado.sum { it.saldoDevedor } ?: 0
        ]

        return [creditos: resultado, totais: totais]
    }

    /**
     * Relatório de Créditos por Gestor num Período
     */
    def creditosPorGestor(Date dataInicio, Date dataFim, String gestor = null) {
        println "📊 Gerando relatório de créditos por gestor"
        
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        def criteria = Credito.createCriteria()
        def creditos = criteria.list {
            between('dataEmissao', dataInicio, dataFimAjustada)
            eq('ativo', true)
            if (gestor) {
                eq('criadoPor', gestor)
            }
            order('criadoPor', 'asc')
            order('dataEmissao', 'desc')
        }

        // Agrupar por gestor
        def porGestor = [:]
        creditos.each { credito ->
            def gestorNome = credito.criadoPor ?: 'Desconhecido'
            if (!porGestor[gestorNome]) {
                porGestor[gestorNome] = [
                    gestor: gestorNome,
                    creditos: [],
                    totalCreditos: 0,
                    valorTotalConcedido: 0,
                    valorTotalAPagar: 0,
                    valorTotalPago: 0
                ]
            }
            
            def gestorData = porGestor[gestorNome]
            gestorData.creditos << [
                id: credito.id,
                numero: credito.numero,
                dataEmissao: credito.dataEmissao,
                entidadeNome: credito.entidade?.nome,
                valorConcedido: credito.valorConcedido,
                valorTotal: credito.valorTotal,
                totalPago: credito.totalPago ?: 0,
                status: credito.status?.toString()
            ]
            
            gestorData.totalCreditos++
            gestorData.valorTotalConcedido += (credito.valorConcedido ?: 0)
            gestorData.valorTotalAPagar += (credito.valorTotal ?: 0)
            gestorData.valorTotalPago += (credito.totalPago ?: 0)
        }

        def resultado = porGestor.values().toList()
        
        def totais = [
            totalGestores: resultado.size(),
            totalCreditos: creditos.size(),
            valorTotalConcedido: creditos.sum { it.valorConcedido } ?: 0,
            valorTotalAPagar: creditos.sum { it.valorTotal } ?: 0,
            valorTotalPago: creditos.sum { it.totalPago } ?: 0
        ]

        return [gestores: resultado, totais: totais]
    }

    /**
     * Relatório de Prestações por Intervalo de Vencimento
     */
    def prestacoesPorVencimento(Date dataInicio, Date dataFim) {
        println "📊 Gerando relatório de prestações por vencimento"
        
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        def parcelas = Parcela.createCriteria().list {
            createAlias('credito', 'c')
            between('dataVencimento', dataInicio, dataFimAjustada)
            eq('c.ativo', true)
            order('dataVencimento', 'asc')
        }

        def resultado = parcelas.collect { parcela ->
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
                diasAtraso: parcela.diasAtraso,
                creditoNumero: parcela.credito?.numero,
                clienteNome: parcela.credito?.entidade?.nome,
                clienteCodigo: parcela.credito?.entidade?.codigo
            ]
        }

        def totais = [
            totalParcelas: resultado.size(),
            parcelasPagas: resultado.count { it.pago },
            parcelasPendentes: resultado.count { !it.pago },
            parcelasEmMora: resultado.count { it.emMora },
            valorTotalParcelas: resultado.sum { it.valorParcela } ?: 0,
            valorTotalPago: resultado.sum { it.valorPago } ?: 0,
            valorTotalPendente: resultado.sum { it.pago ? 0 : it.valorParcela } ?: 0
        ]

        return [parcelas: resultado, totais: totais]
    }

    /**
     * Relatório de Pagamentos Recebidos num Período
     */
    def pagamentosRecebidos(Date dataInicio, Date dataFim) {
        println "📊 Gerando relatório de pagamentos recebidos"
        
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        def parcelas = Parcela.createCriteria().list {
            createAlias('credito', 'c')
            between('dataPagamento', dataInicio, dataFimAjustada)
            isNotNull('dataPagamento')
            eq('c.ativo', true)
            order('dataPagamento', 'desc')
        }

        def resultado = parcelas.collect { parcela ->
            [
                id: parcela.id,
                dataPagamento: parcela.dataPagamento,
                numeroParcela: parcela.numero,
                valorPago: parcela.valorPago ?: 0,
                formaPagamento: parcela.formaPagamento,
                comprovativo: parcela.comprovativo,
                creditoNumero: parcela.credito?.numero,
                clienteNome: parcela.credito?.entidade?.nome,
                clienteCodigo: parcela.credito?.entidade?.codigo,
                gestor: parcela.credito?.criadoPor
            ]
        }

        def totais = [
            totalPagamentos: resultado.size(),
            valorTotalRecebido: resultado.sum { it.valorPago } ?: 0,
            mediaPorPagamento: resultado.size() > 0 ? (resultado.sum { it.valorPago } ?: 0) / resultado.size() : 0
        ]

        // Agrupar por forma de pagamento
        def porFormaPagamento = [:]
        resultado.each { pag ->
            def forma = pag.formaPagamento ?: 'NÃO INFORMADO'
            if (!porFormaPagamento[forma]) {
                porFormaPagamento[forma] = [forma: forma, quantidade: 0, valor: 0]
            }
            porFormaPagamento[forma].quantidade++
            porFormaPagamento[forma].valor += pag.valorPago
        }

        return [pagamentos: resultado, totais: totais, porFormaPagamento: porFormaPagamento.values().toList()]
    }

    /**
     * Relatório de Saídas (Gastos) num Período
     */
    def saidasPorPeriodo(Date dataInicio, Date dataFim) {
        println "📊 Gerando relatório de saídas"
        
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        def saidas = SaidaCaixa.createCriteria().list {
            between('dataSaida', dataInicio, dataFimAjustada)
            order('dataSaida', 'desc')
        }

        def resultado = saidas.collect { saida ->
            [
                id: saida.id,
                dataSaida: saida.dataSaida,
                descricao: saida.descricao,
                valor: saida.valor,
                categoria: saida.categoria,
                responsavel: saida.responsavel,
                comprovativo: saida.comprovativo
            ]
        }

        def totais = [
            totalSaidas: resultado.size(),
            valorTotalGasto: resultado.sum { it.valor } ?: 0
        ]

        // Agrupar por categoria
        def porCategoria = [:]
        resultado.each { saida ->
            def cat = saida.categoria ?: 'SEM CATEGORIA'
            if (!porCategoria[cat]) {
                porCategoria[cat] = [categoria: cat, quantidade: 0, valor: 0]
            }
            porCategoria[cat].quantidade++
            porCategoria[cat].valor += saida.valor
        }

        return [saidas: resultado, totais: totais, porCategoria: porCategoria.values().toList()]
    }

    /**
     * Relatório de Diários num Período
     */
    def diariosPorPeriodo(Date dataInicio, Date dataFim) {
        println "📊 Gerando relatório de diários"
        
        Calendar cal = Calendar.getInstance()
        cal.setTime(dataFim)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        Date dataFimAjustada = cal.getTime()

        def diarios = Diario.createCriteria().list {
            between('dataDiario', dataInicio, dataFimAjustada)
            order('dataDiario', 'desc')
        }

        def resultado = diarios.collect { diario ->
            [
                id: diario.id,
                dataDiario: diario.dataDiario,
                saldoInicial: diario.saldoInicial,
                totalEntradas: diario.totalEntradas,
                totalSaidas: diario.totalSaidas,
                saldoFinal: diario.saldoFinal,
                fechado: diario.fechado,
                dataFechamento: diario.dataFechamento,
                responsavel: diario.responsavel
            ]
        }

        def totais = [
            totalDias: resultado.size(),
            totalEntradas: resultado.sum { it.totalEntradas } ?: 0,
            totalSaidas: resultado.sum { it.totalSaidas } ?: 0,
            saldoMedio: resultado.size() > 0 ? (resultado.sum { it.saldoFinal } ?: 0) / resultado.size() : 0
        ]

        return [diarios: resultado, totais: totais]
    }

    /**
     * Relatório de Todos os Créditos em Mora
     */
    def creditosEmMora() {
        println "📊 Gerando relatório de créditos em mora"
        
        def creditos = Credito.createCriteria().list {
            eq('ativo', true)
            eq('emMora', true)
            order('dataEmissao', 'desc')
        }

        def resultado = creditos.collect { credito ->
            // Calcular total em mora
            def totalEmMora = credito.parcelas?.findAll { it.emMora }?.sum { 
                (it.valorEmMora ?: 0) + (it.valorJurosDemora ?: 0) 
            } ?: 0
            
            def parcelasEmAtraso = credito.parcelas?.findAll { it.emMora }?.size() ?: 0
            def maiorAtraso = credito.parcelas?.findAll { it.emMora }?.max { it.diasAtraso }?.diasAtraso ?: 0

            [
                id: credito.id,
                numero: credito.numero,
                dataEmissao: credito.dataEmissao,
                entidadeNome: credito.entidade?.nome,
                entidadeCodigo: credito.entidade?.codigo,
                entidadeTelefone: credito.entidade?.contacto?.telefone1,
                valorConcedido: credito.valorConcedido,
                valorTotal: credito.valorTotal,
                totalPago: credito.totalPago ?: 0,
                saldoDevedor: (credito.valorTotal ?: 0) - (credito.totalPago ?: 0),
                totalEmMora: totalEmMora,
                parcelasEmAtraso: parcelasEmAtraso,
                maiorAtraso: maiorAtraso,
                gestor: credito.criadoPor
            ]
        }

        def totais = [
            totalCreditosEmMora: resultado.size(),
            valorTotalEmMora: resultado.sum { it.totalEmMora } ?: 0,
            totalParcelasEmAtraso: resultado.sum { it.parcelasEmAtraso } ?: 0
        ]

        return [creditos: resultado, totais: totais]
    }

    /**
     * Relatório de Todos os Usuários
     */
    def todosUsuarios() {
        println "📊 Gerando relatório de usuários"
        
        def usuarios = Usuario.list(sort: 'username', order: 'asc')

        def resultado = usuarios.collect { usuario ->
            def creditosAtivos = Credito.countByCriadoPorAndAtivo(usuario.username, true)
            
            [
                id: usuario.id,
                username: usuario.username,
                nome: usuario.nome,
                email: usuario.email,
                ativo: usuario.ativo,
                dateCreated: usuario.dateCreated,
                lastUpdated: usuario.lastUpdated,
                creditosAtivos: creditosAtivos
            ]
        }

        def totais = [
            totalUsuarios: resultado.size(),
            usuariosAtivos: resultado.count { it.ativo },
            usuariosInativos: resultado.count { !it.ativo }
        ]

        return [usuarios: resultado, totais: totais]
    }

    /**
     * Relatório de Usuários com Créditos Ativos
     */
    def usuariosComCreditosAtivos() {
        println "📊 Gerando relatório de usuários com créditos ativos"
        
        def gestores = Usuario.executeQuery(
            "SELECT DISTINCT c.criadoPor FROM Credito c WHERE c.ativo = true"
        )

        def resultado = gestores.collect { gestorUsername ->
            def usuario = Usuario.findByUsername(gestorUsername)
            def creditos = Credito.findAllByCriadoPorAndAtivo(gestorUsername, true)
            
            def valorTotalConcedido = creditos.sum { it.valorConcedido } ?: 0
            def valorTotalAPagar = creditos.sum { it.valorTotal } ?: 0
            def valorTotalPago = creditos.sum { it.totalPago } ?: 0

            [
                username: gestorUsername,
                nome: usuario?.nome ?: gestorUsername,
                email: usuario?.email,
                totalCreditos: creditos.size(),
                valorTotalConcedido: valorTotalConcedido,
                valorTotalAPagar: valorTotalAPagar,
                valorTotalPago: valorTotalPago,
                saldoDevedor: valorTotalAPagar - valorTotalPago
            ]
        }.sort { -it.totalCreditos }

        def totais = [
            totalGestores: resultado.size(),
            totalCreditos: resultado.sum { it.totalCreditos } ?: 0,
            valorTotalConcedido: resultado.sum { it.valorTotalConcedido } ?: 0,
            valorTotalAPagar: resultado.sum { it.valorTotalAPagar } ?: 0,
            valorTotalPago: resultado.sum { it.valorTotalPago } ?: 0
        ]

        return [gestores: resultado, totais: totais]
    }

    /**
     * Relatório de Clientes com Atrasos
     */
    def clientesComAtrasos() {
        println "📊 Gerando relatório de clientes com atrasos"
        
        def creditosEmMora = Credito.createCriteria().list {
            eq('ativo', true)
            eq('emMora', true)
        }

        // Agrupar por cliente
        def porCliente = [:]
        creditosEmMora.each { credito ->
            def clienteId = credito.entidade?.id
            if (!clienteId) return
            
            if (!porCliente[clienteId]) {
                porCliente[clienteId] = [
                    clienteId: clienteId,
                    clienteNome: credito.entidade?.nome,
                    clienteCodigo: credito.entidade?.codigo,
                    clienteTelefone: credito.entidade?.contacto?.telefone1,
                    creditos: [],
                    totalCreditosEmMora: 0,
                    totalEmMora: 0,
                    maiorAtraso: 0
                ]
            }
            
            def clienteData = porCliente[clienteId]
            def totalEmMora = credito.parcelas?.findAll { it.emMora }?.sum { 
                (it.valorEmMora ?: 0) + (it.valorJurosDemora ?: 0) 
            } ?: 0
            
            def maiorAtraso = credito.parcelas?.findAll { it.emMora }?.max { it.diasAtraso }?.diasAtraso ?: 0
            
            clienteData.creditos << [
                numero: credito.numero,
                valorTotal: credito.valorTotal,
                totalEmMora: totalEmMora,
                maiorAtraso: maiorAtraso
            ]
            
            clienteData.totalCreditosEmMora++
            clienteData.totalEmMora += totalEmMora
            if (maiorAtraso > clienteData.maiorAtraso) {
                clienteData.maiorAtraso = maiorAtraso
            }
        }

        def resultado = porCliente.values().toList().sort { -it.totalEmMora }

        def totais = [
            totalClientesEmAtraso: resultado.size(),
            valorTotalEmMora: resultado.sum { it.totalEmMora } ?: 0
        ]

        return [clientes: resultado, totais: totais]
    }

    /**
     * Avaliar pontualidade do cliente e classificar
     */
    def avaliarPontualidadeCliente(Long clienteId) {
        println "📊 Avaliando pontualidade do cliente: ${clienteId}"
        
        def entidade = Entidade.get(clienteId)
        if (!entidade) return null

        def creditos = Credito.findAllByEntidadeAndAtivo(entidade, true)
        if (!creditos) return null

        def totalParcelas = 0
        def parcelasPagasNoPrazo = 0
        def parcelasPagasAtrasadas = 0
        def parcelasPendentes = 0
        def totalDiasAtraso = 0

        creditos.each { credito ->
            credito.parcelas?.each { parcela ->
                if (parcela.pago) {
                    totalParcelas++
                    if (parcela.pagoNoPrazo) {
                        parcelasPagasNoPrazo++
                    } else {
                        parcelasPagasAtrasadas++
                        totalDiasAtraso += (parcela.diasAtraso ?: 0)
                    }
                } else if (parcela.dataVencimento < new Date()) {
                    parcelasPendentes++
                }
            }
        }

        if (totalParcelas == 0) return null

        def percentualNoPrazo = (parcelasPagasNoPrazo / totalParcelas) * 100
        def mediaDiasAtraso = parcelasPagasAtrasadas > 0 ? totalDiasAtraso / parcelasPagasAtrasadas : 0

        // Classificação
        def classificacao
        def corClassificacao
        
        if (percentualNoPrazo >= 95) {
            classificacao = 'EXCELENTE'
            corClassificacao = '#52c41a' // Verde
        } else if (percentualNoPrazo >= 80) {
            classificacao = 'BOM'
            corClassificacao = '#1890ff' // Azul
        } else if (percentualNoPrazo >= 60) {
            classificacao = 'REGULAR'
            corClassificacao = '#faad14' // Amarelo
        } else if (percentualNoPrazo >= 40) {
            classificacao = 'RUIM'
            corClassificacao = '#fa8c16' // Laranja
        } else {
            classificacao = 'PÉSSIMO'
            corClassificacao = '#ff4d4f' // Vermelho
        }

        def avaliacao = [
            clienteId: clienteId,
            clienteNome: entidade.nome,
            clienteCodigo: entidade.codigo,
            totalCreditos: creditos.size(),
            totalParcelas: totalParcelas,
            parcelasPagasNoPrazo: parcelasPagasNoPrazo,
            parcelasPagasAtrasadas: parcelasPagasAtrasadas,
            parcelasPendentes: parcelasPendentes,
            percentualNoPrazo: percentualNoPrazo.round(2),
            mediaDiasAtraso: mediaDiasAtraso.round(2),
            classificacao: classificacao,
            corClassificacao: corClassificacao
        ]

        // Atualizar classificação na entidade se existir o campo
        try {
            if (entidade.metaClass.hasProperty(entidade, 'classificacao')) {
                entidade.classificacao = classificacao
                entidade.save(flush: true)
            }
        } catch (Exception e) {
            println "⚠️ Não foi possível atualizar classificação na entidade: ${e.message}"
        }

        return avaliacao
    }

    /**
     * Dashboard Analítico - Visão Geral da Empresa
     */
    def dashboardAnalitico() {
        println "📊 Gerando dashboard analítico"
        
        def agora = new Date()
        def inicioMes = new Date(agora.year, agora.month, 1)
        def fimMes = new Date(agora.year, agora.month + 1, 0)

        // Créditos Ativos
        def creditosAtivos = Credito.countByAtivo(true)
        def creditosEmMora = Credito.countByAtivoAndEmMora(true, true)
        def creditosQuitados = Credito.countByQuitado(true)

        // Valores Totais
        def todosCreditos = Credito.findAllByAtivo(true)
        def valorTotalConcedido = todosCreditos.sum { it.valorConcedido } ?: 0
        def valorTotalAPagar = todosCreditos.sum { it.valorTotal } ?: 0
        def valorTotalPago = todosCreditos.sum { it.totalPago } ?: 0
        def saldoTotalDevedor = valorTotalAPagar - valorTotalPago

        // Este Mês
        def creditosEsteMes = Credito.createCriteria().list {
            between('dataEmissao', inicioMes, fimMes)
            eq('ativo', true)
        }
        def valorConcedidoEsteMes = creditosEsteMes.sum { it.valorConcedido } ?: 0

        // Pagamentos Este Mês
        Calendar cal = Calendar.getInstance()
        cal.setTime(fimMes)
        cal.add(Calendar.DAY_OF_MONTH, 1)
        
        def pagamentosEsteMes = Parcela.createCriteria().list {
            between('dataPagamento', inicioMes, cal.getTime())
            isNotNull('dataPagamento')
        }
        def valorRecebidoEsteMes = pagamentosEsteMes.sum { it.valorPago } ?: 0

        // Saídas Este Mês
        def saidasEsteMes = SaidaCaixa.createCriteria().list {
            between('dataSaida', inicioMes, cal.getTime())
        }
        def valorGastoEsteMes = saidasEsteMes.sum { it.valor } ?: 0

        // Lucro/Prejuízo Este Mês
        def lucroEsteMes = valorRecebidoEsteMes - valorGastoEsteMes

        // Taxa de Inadimplência
        def taxaInadimplencia = creditosAtivos > 0 ? (creditosEmMora / creditosAtivos * 100).round(2) : 0

        // Recuperação (quanto foi pago vs quanto deveria ter sido pago)
        def taxaRecuperacao = valorTotalAPagar > 0 ? (valorTotalPago / valorTotalAPagar * 100).round(2) : 0

        return [
            creditos: [
                ativos: creditosAtivos,
                emMora: creditosEmMora,
                quitados: creditosQuitados,
                taxaInadimplencia: taxaInadimplencia
            ],
            financeiro: [
                valorTotalConcedido: valorTotalConcedido,
                valorTotalAPagar: valorTotalAPagar,
                valorTotalPago: valorTotalPago,
                saldoDevedor: saldoTotalDevedor,
                taxaRecuperacao: taxaRecuperacao
            ],
            esteMes: [
                creditosEmitidos: creditosEsteMes.size(),
                valorConcedido: valorConcedidoEsteMes,
                valorRecebido: valorRecebidoEsteMes,
                valorGasto: valorGastoEsteMes,
                lucro: lucroEsteMes
            ],
            alertas: [
                creditosEmMora: creditosEmMora,
                inadimplenciaAlta: taxaInadimplencia > 20,
                lucroNegativo: lucroEsteMes < 0
            ]
        ]
    }

    /**
     * Buscar todos os usuários com role GESTOR
     */
    def getGestores() {
        println "📊 Buscando gestores (role GESTOR)"
        
        try {
            // Buscar a role GESTOR
            def roleGestor = Role.findByName('GESTOR')
            if (!roleGestor) {
                println "⚠️ Role GESTOR não encontrada"
                return []
            }

            // Buscar usuários com essa role através da tabela UsuarioRole
            def usuariosRoles = UsuarioRole.findAllByRole(roleGestor)
            
            def gestores = usuariosRoles.collect { ur ->
                try {
                    def usuario = ur.usuario
                    if (usuario) {
                        return [
                            username: usuario.username,
                            nome: usuario.nome ?: usuario.username,
                            email: usuario.email ?: ''
                        ]
                    }
                } catch (Exception e) {
                    println "⚠️ Erro ao processar usuário: ${e.message}"
                }
                return null
            }.findAll { it != null }  // Remover nulos
            
            // Ordenar por nome
            gestores = gestores.sort { it.nome }

            println "✅ Encontrados ${gestores.size()} gestores"
            return gestores
        } catch (Exception e) {
            println "❌ Erro ao buscar gestores: ${e.message}"
            e.printStackTrace()
            return []
        }
    }
}
