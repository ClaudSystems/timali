// grails-app/services/app/timali/DiarioCaixaService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import java.text.SimpleDateFormat

@Transactional
class DiarioCaixaService {

    def springSecurityService

    // ================================================================
    // UTILITÁRIOS DE DATA
    // ================================================================

    /**
     * Faz o parsing de uma string de data no formato yyyy-MM-dd
     */


    Date parseDate(String dateString) {
        if (!dateString) return null
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd")
            sdf.setLenient(false)
            return sdf.parse(dateString)
        } catch (Exception e) {
            return null
        }
    }

    @Transactional
    Diario reabrirDiario(Diario diario) {
        if (diario.estado != 'fechado') {
            throw new RuntimeException("Diário não está fechado")
        }

        // Fechar todos os outros diários abertos
        def outrosAbertos = Diario.findAllByEstado('aberto')
        outrosAbertos.each { d ->
            if (d.id != diario.id) {
                d.estado = 'fechado'
                d.dateClosed = new Date()
                d.fechadoPor = springSecurityService?.currentUser?.username ?: 'sistema'
                d.atualizarTotais()
                d.save(flush: true, failOnError: true)
            }
        }

        // Reabrir este
        diario.estado = 'aberto'
        diario.dateClosed = null
        diario.fechadoPor = null
        diario.lastUpdated = new Date()
        diario.atualizarTotais()
        diario.save(flush: true, failOnError: true)

        return diario
    }



    /**
     * Retorna o início do dia (00:00:00.000)
     */
    Date getDayStart(Date date) {
        if (!date) return null
        Calendar cal = Calendar.getInstance()
        cal.setTime(date)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.getTime()
    }

    /**
     * Retorna o fim do dia (23:59:59.999)
     */
    Date getDayEnd(Date date) {
        if (!date) return null
        Calendar cal = Calendar.getInstance()
        cal.setTime(date)
        cal.set(Calendar.HOUR_OF_DAY, 23)
        cal.set(Calendar.MINUTE, 59)
        cal.set(Calendar.SECOND, 59)
        cal.set(Calendar.MILLISECOND, 999)
        return cal.getTime()
    }

    /**
     * Retorna um Map com inicio e fim do dia
     */
    Map getDayRange(Date date) {
        return [inicio: getDayStart(date), fim: getDayEnd(date)]
    }

    /**
     * Formata uma data para String
     */
    String formatDate(Date date, String pattern = "dd/MM/yyyy") {
        if (!date) return '-'
        try {
            SimpleDateFormat sdf = new SimpleDateFormat(pattern)
            if (date instanceof java.sql.Timestamp) {
                date = new Date(date.getTime())
            }
            return sdf.format(date)
        } catch (Exception e) {
            return date.toString()
        }
    }

    // ================================================================
    // ACESSO A DADOS (MOVIMENTAÇÕES)
    // ================================================================

    /**
     * Busca todas as movimentações (pagamentos e saídas) de um dia
     */
    Map buscarMovimentacoesDoDia(Date data) {
        Map range = getDayRange(data)
        Date inicio = range.inicio
        Date fim = range.fim

        def pagamentos = Pagamento.createCriteria().list {
            between('dataPagamento', inicio, fim)
            order('dataPagamento', 'asc')
        }

        def saidas = SaidaCaixa.createCriteria().list {
            between('dataSaida', inicio, fim)
            order('dataSaida', 'asc')
        }

        return [pagamentos: pagamentos, saidas: saidas]
    }

    /**
     * Busca pagamentos de um intervalo
     */
    List<Pagamento> buscarPagamentos(Date inicio, Date fim) {
        return Pagamento.createCriteria().list {
            between('dataPagamento', inicio, fim)
            order('dataPagamento', 'asc')
        }
    }

    /**
     * Busca saídas de um intervalo
     */
    List<SaidaCaixa> buscarSaidas(Date inicio, Date fim) {
        return SaidaCaixa.createCriteria().list {
            between('dataSaida', inicio, fim)
            order('dataSaida', 'asc')
        }
    }

    // ================================================================
    // CRIAÇÃO E ASSOCIAÇÃO DE DIÁRIO
    // ================================================================

    /**
     * Encontra ou cria um diário para uma data
     */
    Diario encontrarOuCriarDiario(Date data) {
        Date dataLimpa = getDayStart(data)
        Diario diario = Diario.findByDataReferencia(dataLimpa)

        if (!diario) {
            diario = new Diario()
            diario.dataReferencia = dataLimpa
            diario.estado = 'aberto'
            diario.numeroDiario = gerarNumeroDiario(dataLimpa)
            diario.totalRecebimentos = 0.0
            diario.totalSaidas = 0.0
            diario.saldo = 0.0
            diario.dateCreated = new Date()
            diario.lastUpdated = new Date()

            def currentUser = springSecurityService?.currentUser
            if (currentUser) {
                diario.usuario = currentUser
                diario.criadoPor = currentUser.username
            }

            diario.save(flush: true, failOnError: true)
            log.info "📒 Diário criado: ${diario.numeroDiario}"
        }

        return diario
    }

    /**
     * Associa um pagamento ao diário do dia
     */
    Diario associarPagamentoAoDiario(Pagamento pagamento) {
        if (!pagamento || !pagamento.dataPagamento) return null

        Diario diario = encontrarOuCriarDiario(pagamento.dataPagamento)

        pagamento.diario = diario
        pagamento.save(flush: true)

        if (!diario.pagamentos?.contains(pagamento)) {
            diario.addToPagamentos(pagamento)
        }

        diario.atualizarTotais()
        diario.save(flush: true)

        log.info "📒 Recibo ${pagamento.numeroRecibo} → Diário ${diario.numeroDiario}"
        return diario
    }

    /**
     * Associa uma saída ao diário do dia
     */
    Diario associarSaidaAoDiario(SaidaCaixa saida) {
        if (!saida || !saida.dataSaida) return null

        Diario diario = encontrarOuCriarDiario(saida.dataSaida)

        saida.diario = diario
        saida.save(flush: true)

        if (!diario.saidas?.contains(saida)) {
            diario.addToSaidas(saida)
        }

        diario.atualizarTotais()
        diario.save(flush: true)

        log.info "📒 Saída ${saida.id} → Diário ${diario.numeroDiario}"
        return diario
    }

    /**
     * Associa múltiplas movimentações a um diário
     */
    void associarMovimentacoesAoDiario(Diario diario, List<Pagamento> pagamentos, List<SaidaCaixa> saidas) {
        pagamentos?.each { pagamento ->
            if (!pagamento.diario) {
                pagamento.diario = diario
                pagamento.save(flush: true)
            }
            if (!diario.pagamentos?.contains(pagamento)) {
                diario.addToPagamentos(pagamento)
            }
        }

        saidas?.each { saida ->
            if (!saida.diario) {
                saida.diario = diario
                saida.save(flush: true)
            }
            if (!diario.saidas?.contains(saida)) {
                diario.addToSaidas(saida)
            }
        }

        diario.atualizarTotais()
        diario.save(flush: true)
    }

    // ================================================================
    // GERAÇÃO DE DIÁRIO
    // ================================================================

    /**
     * Gera um novo diário para uma data específica
     */
    Diario gerarDiario(Date data) {
        Date dataLimpa = getDayStart(data)

        // Verificar se já existe
        Diario existente = Diario.findByDataReferencia(dataLimpa)
        if (existente) return existente

        // Buscar movimentações
        Map movimentacoes = buscarMovimentacoesDoDia(dataLimpa)
        List<Pagamento> pagamentos = movimentacoes.pagamentos
        List<SaidaCaixa> saidas = movimentacoes.saidas

        // Criar diário
        Diario diario = encontrarOuCriarDiario(dataLimpa)

        // Associar movimentações
        associarMovimentacoesAoDiario(diario, pagamentos, saidas)

        return diario
    }

    /**
     * Fecha um diário
     */
    @Transactional
    Diario fecharDiario(Diario diario, String notas = null, Boolean lancarSaida = false, String formaPagamento = 'DINHEIRO') {
        if (diario.estado == 'fechado') {
            throw new RuntimeException("Diário já está fechado")
        }

        // Lançar saída do saldo se solicitado e tiver saldo positivo
        if (lancarSaida && diario.saldo > 0) {
            SaidaCaixa saida = new SaidaCaixa()
            saida.descricao = "Fecho de Caixa - ${diario.numeroDiario}"
            saida.tipo = 'FEICHO_CAIXA'
            saida.formaPagamento = formaPagamento
            saida.valor = diario.saldo
            saida.dataSaida = new Date()
            saida.diario = diario
            saida.criadoPor = diario.criadoPor ?: 'sistema'
            saida.usuario = diario.usuario

            if (saida.save(flush: true)) {
                diario.addToSaidas(saida)
            }
        }

        // Atualizar totais e fechar
        diario.atualizarTotais()
        diario.estado = 'fechado'
        diario.dateClosed = new Date()
        diario.fechadoPor = springSecurityService?.currentUser?.username ?: 'sistema'
        if (notas) diario.notas = notas
        diario.lastUpdated = new Date()
        diario.save(flush: true, failOnError: true)

        return diario
    }



    // ================================================================
    // FORMATAÇÃO JSON
    // ================================================================

    /**
     * Formata um diário completo para resposta JSON
     * Este é o ÚNICO método de formatação de diário
     */
    Map formatarDiario(Diario diario) {
        if (!diario) return [:]

        // Buscar movimentações se não estiverem carregadas
        def pagamentos = diario.pagamentos ?: []
        def saidas = diario.saidas ?: []

        // Se não tem coleções carregadas, buscar do banco
        if (!pagamentos && !saidas) {
            Map range = getDayRange(diario.dataReferencia)
            pagamentos = buscarPagamentos(range.inicio, range.fim)
            saidas = buscarSaidas(range.inicio, range.fim)
        }

        // Categorizar saídas (usa o método do domain)
        def saidasAtivas = diario.getSaidasAtivas() ?: saidas.findAll { it.tipo in Diario.TIPOS_SAIDAS_ATIVAS }
        def saidasPassivas = diario.getSaidasPassivas() ?: saidas.findAll { it.tipo in Diario.TIPOS_SAIDAS_PASSIVAS }

        // Totais (usa os métodos do domain)
        BigDecimal totalSaidasAtivas = diario.getTotalSaidasAtivas() ?: saidasAtivas.sum { it.valor ?: 0 } ?: 0.0
        BigDecimal totalSaidasPassivas = diario.getTotalSaidasPassivas() ?: saidasPassivas.sum { it.valor ?: 0 } ?: 0.0

        return [
                id: diario.id,
                numeroDiario: diario.numeroDiario,
                dataReferencia: diario.dataReferencia,
                estado: diario.estado,
                fechado: diario.estado == 'fechado',
                dateCreated: diario.dateCreated,
                dateClosed: diario.dateClosed,
                lastUpdated: diario.lastUpdated,
                fechadoPor: diario.fechadoPor,
                criadoPor: diario.criadoPor,
                notas: diario.notas,

                recebimentos: pagamentos.collect { pagamento ->
                    [
                            id: pagamento.id,
                            numeroRecibo: pagamento.numeroRecibo,
                            nomeCliente: pagamento.entidade?.nome ?: 'N/A',
                            nuit: pagamento.entidade?.nuit ?: '',
                            descricao: pagamento.descricao ?: "Pagamento",
                            dataPagamento: pagamento.dataPagamento,
                            formaPagamento: pagamento.formaPagamento ?: 'N/I',
                            valorPago: pagamento.valorPago ?: 0.0,
                            referenciaPagamento: pagamento.referenciaPagamento ?: '',
                            utilizador: pagamento.usuario?.username ?: pagamento.criadoPor ?: ''
                    ]
                },

                saidasAtivas: saidasAtivas.collect { saida ->
                    [
                            id: saida.id,
                            dateCreated: saida.dateCreated,
                            dataSaida: saida.dataSaida,
                            dataPagamento: saida.dataSaida,
                            descricao: saida.descricao ?: '',
                            origem: saida.formaPagamento ?: '',
                            destino: saida.tipo ?: '',
                            tipo: saida.tipo ?: '',
                            valor: saida.valor ?: 0.0,
                            referencia: saida.referencia ?: '',
                            utilizador: saida.usuario?.username ?: saida.criadoPor ?: ''
                    ]
                },

                saidasPassivas: saidasPassivas.collect { saida ->
                    [
                            id: saida.id,
                            dateCreated: saida.dateCreated,
                            dataSaida: saida.dataSaida,
                            dataPagamento: saida.dataSaida,
                            descricao: saida.descricao ?: '',
                            origem: saida.formaPagamento ?: '',
                            destino: saida.tipo ?: '',
                            tipo: saida.tipo ?: '',
                            valor: saida.valor ?: 0.0,
                            referencia: saida.referencia ?: '',
                            utilizador: saida.usuario?.username ?: saida.criadoPor ?: ''
                    ]
                },

                totais: [
                        totalRecebimentos: diario.totalRecebimentos ?: 0.0,
                        totalSaidasAtivas: totalSaidasAtivas,
                        totalSaidasPassivas: totalSaidasPassivas,
                        totalSaidas: diario.totalSaidas ?: 0.0,
                        saldo: diario.saldo ?: 0.0
                ]
        ]
    }

    /**
     * Formata um diário para listagem (versão simplificada)
     */
    List formatarDiariosParaListagem(List<Diario> diarios) {
        return diarios.collect { diario ->
            [
                    id: diario.id,
                    numeroDiario: diario.numeroDiario,
                    dataReferencia: diario.dataReferencia,
                    estado: diario.estado ?: 'aberto',
                    totalRecebimentos: diario.totalRecebimentos ?: 0.0,
                    totalSaidas: diario.totalSaidas ?: 0.0,
                    saldo: diario.saldo ?: 0.0,
                    fechadoPor: diario.fechadoPor,
                    criadoPor: diario.criadoPor,
                    notas: diario.notas,
                    dateCreated: diario.dateCreated,
                    dateClosed: diario.dateClosed,
                    lastUpdated: diario.lastUpdated
            ]
        }
    }

    // ================================================================
    // UTILITÁRIOS PRIVADOS
    // ================================================================

    private String gerarNumeroDiario(Date data) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd")
        String prefixo = sdf.format(data)
        def count = Diario.countByDataReferencia(data) + 1
        return "DIA-${prefixo}-${String.format('%03d', count)}"
    }
}