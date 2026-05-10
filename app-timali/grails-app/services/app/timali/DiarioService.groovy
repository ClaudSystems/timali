// grails-app/services/app/timali/DiarioService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import java.text.SimpleDateFormat

@Transactional
class DiarioService {

    def springSecurityService

    /**
     * Fechar diário manualmente
     * @param dataReferencia - Data do diário
     * @param notas - Notas de fechamento
     * @param lancarSaida - Se deve lançar saída com o saldo
     * @param formaPagamento - Forma de pagamento da saída (se lançarSaida=true)
     */
    // grails-app/services/app/timali/DiarioService.groovy

/**
 * Reorganizar diários: garantir apenas 1 aberto e ordenar por data
 * Chamado sempre que a lista de diários é acessada
 */
    private Map formatarDiarioSimples(Diario diario) {
        Calendar calInicio = Calendar.getInstance()
        calInicio.setTime(diario.dataReferencia)
        calInicio.set(Calendar.HOUR_OF_DAY, 0)
        calInicio.set(Calendar.MINUTE, 0)
        calInicio.set(Calendar.SECOND, 0)
        Calendar calFim = Calendar.getInstance()
        calFim.setTime(calInicio.getTime())
        calFim.add(Calendar.DAY_OF_MONTH, 1)

        // ***** CORRIGIDO: Buscar PAGAMENTOS *****
        def pagamentos = diario.pagamentos ?: Pagamento.createCriteria().list {
            between('dataPagamento', calInicio.getTime(), calFim.getTime())
        }

        def saidas = diario.saidas ?: SaidaCaixa.createCriteria().list {
            between('dataSaida', calInicio.getTime(), calFim.getTime())
        }

        def saidasAtivas = saidas.findAll { it.tipo in ['DESPESA', 'MATERIAL', 'SERVICO', 'OUTRO'] }
        def saidasPassivas = saidas.findAll { it.tipo in ['REEMBOLSO', 'FORNECEDOR', 'SALARIO', 'FEICHO_CAIXA'] }

        println "formatarDiarioSimples - Pagamentos: ${pagamentos.size()}, Saídas: ${saidas.size()}"

        return [
                id: diario.id,
                numeroDiario: diario.numeroDiario,
                dataReferencia: diario.dataReferencia,
                estado: diario.estado,
                fechado: diario.estado == 'fechado',
                dateCreated: diario.dateCreated,
                dateClosed: diario.dateClosed,
                fechadoPor: diario.fechadoPor,
                notas: diario.notas,
                // ***** CORRIGIDO: Formatar PAGAMENTOS *****
                recebimentos: pagamentos.collect { pagamento ->
                    [
                            id: pagamento.id,
                            numeroRecibo: pagamento.numeroRecibo,
                            nomeCliente: pagamento.entidade?.nome,
                            nuit: pagamento.entidade?.nuit,
                            descricao: pagamento.descricao ?: "Pagamento Crédito #${pagamento.credito?.numero}",
                            dataPagamento: pagamento.dataPagamento,
                            formaPagamento: pagamento.formaPagamento,
                            valorPago: pagamento.valorPago,
                            referenciaPagamento: pagamento.referenciaPagamento
                    ]
                },
                saidasAtivas: saidasAtivas.collect { saida ->
                    [
                            id: saida.id, dateCreated: saida.dateCreated,
                            dataSaida: saida.dataSaida, dataPagamento: saida.dataSaida,
                            descricao: saida.descricao, origem: saida.formaPagamento,
                            destino: saida.tipo, valor: saida.valor
                    ]
                },
                saidasPassivas: saidasPassivas.collect { saida ->
                    [
                            id: saida.id, dateCreated: saida.dateCreated,
                            dataSaida: saida.dataSaida, dataPagamento: saida.dataSaida,
                            descricao: saida.descricao, origem: saida.formaPagamento,
                            destino: saida.tipo, valor: saida.valor
                    ]
                },
                totais: [
                        totalRecebimentos: diario.totalRecebimentos ?: 0.0,
                        totalSaidasAtivas: diario.totalSaidasAtivasCalculado,
                        totalSaidasPassivas: diario.totalSaidasPassivasCalculado,
                        totalSaidas: diario.totalSaidas ?: 0.0,
                        saldo: diario.saldo ?: 0.0
                ]
        ]
    }
    private String gerarNumeroDiario(Date data) {
        // Converter para Date seguro (evitar problemas com Timestamp)
        Date safeDate = data instanceof java.sql.Timestamp ? new Date(data.getTime()) : data
        SimpleDateFormat sdf = new SimpleDateFormat("yyMMdd")
        String prefixo = sdf.format(safeDate)
        def count = Diario.countByDataReferencia(data) + 1
        return "DIA-${prefixo}-${String.format('%03d', count)}"
    }
    @Transactional
    def reorganizarDiarios() {
        log.info("🔄 Reorganizando diários...")

        def todosDiarios = Diario.listOrderByDataReferencia('desc')
        def diariosAbertos = todosDiarios.findAll { it.estado in ['aberto', 'pendente'] }

        log.info("Total diários: ${todosDiarios.size()}, Abertos/Pendentes: ${diariosAbertos.size()}")

        if (diariosAbertos.size() > 1) {
            log.warn("⚠️ Existem ${diariosAbertos.size()} diários abertos! Apenas 1 deve estar aberto.")

            // Manter o MAIS RECENTE aberto, fechar os outros
            def maisRecente = diariosAbertos.first()

            diariosAbertos.each { diario ->
                if (diario.id != maisRecente.id) {
                    // Fechar automaticamente
                    diario.estado = 'fechado'
                    diario.dateClosed = diario.dateClosed ?: new Date()
                    diario.lastUpdated = new Date()
                    diario.fechadoPor = diario.fechadoPor ?: 'SISTEMA (reorganização)'
                    diario.saldoFinal = diario.saldo

                    if (diario.save(flush: true)) {
                        log.info("  ✅ Diário ${diario.numeroDiario} fechado automaticamente")
                    } else {
                        log.error("  ❌ Erro ao fechar ${diario.numeroDiario}: ${diario.errors}")
                    }
                }
            }

            log.info("  📒 Diário mantido aberto: ${maisRecente.numeroDiario}")
        } else if (diariosAbertos.size() == 0) {
            // Se não há diário aberto, abrir o diário de HOJE (ou criar)
            def hoje = clearTime(new Date())
            def diarioHoje = Diario.findByDataReferencia(hoje)

            if (diarioHoje && diarioHoje.estado == 'fechado') {
                // Reabrir como pendente
                diarioHoje.estado = 'pendente'
                diarioHoje.motivoReabertura = 'Reaberto automaticamente pelo sistema'
                diarioHoje.lastUpdated = new Date()
                diarioHoje.dateClosed = null
                diarioHoje.save(flush: true)
                log.info("  📒 Diário de hoje reaberto: ${diarioHoje.numeroDiario}")
            } else if (!diarioHoje) {
                // Criar diário de hoje
                diarioHoje = new Diario()
                diarioHoje.dataReferencia = hoje
                diarioHoje.estado = 'aberto'
                diarioHoje.numeroDiario = gerarNumeroDiario(hoje)
                diarioHoje.totalRecebimentos = 0.0
                diarioHoje.totalSaidas = 0.0
                diarioHoje.saldo = 0.0
                diarioHoje.dateCreated = new Date()
                diarioHoje.lastUpdated = new Date()
                diarioHoje.criadoPor = 'SISTEMA'
                diarioHoje.save(flush: true)
                log.info("  📒 Diário de hoje criado: ${diarioHoje.numeroDiario}")
            }
        }

        log.info("✅ Reorganização concluída!")
    }

    private Date clearTime(Date date) {
        Calendar cal = Calendar.getInstance()
        cal.setTime(date)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.getTime()
    }

    // grails-app/services/app/timali/DiarioService.groovy

    @Transactional
    Map fecharDiarioManual(Date dataReferencia, String notas, boolean lancarSaida, String formaPagamento) {
        Diario diario = Diario.findByDataReferencia(dataReferencia)
        if (!diario) throw new RuntimeException("Diário não encontrado")
        if (diario.estado == 'fechado') throw new RuntimeException("Diário já está fechado")

        // Recalcular totais
        atualizarTotais(diario)

        def currentUser = springSecurityService?.currentUser

        // Se lançar saída com o saldo
        if (lancarSaida && diario.saldo > 0) {
            SaidaCaixa saida = new SaidaCaixa()
            // ***** CORRIGIDO: Usar a data do diário, NÃO new Date() *****
            saida.dataSaida = diario.dataReferencia  // ← ERA new Date()
            saida.descricao = "Fecho de caixa - Diário ${diario.numeroDiario}"
            saida.tipo = 'FEICHO_CAIXA'
            saida.formaPagamento = formaPagamento ?: 'DINHEIRO'
            saida.valor = diario.saldo
            saida.diario = diario
            saida.usuario = currentUser
            saida.criadoPor = currentUser?.username

            if (!saida.save(flush: true)) {
                throw new RuntimeException("Erro ao lançar saída de fecho: ${saida.errors}")
            }

            diario.addToSaidas(saida)
        }

        // Recalcular totais novamente
        atualizarTotais(diario)

        // Fechar diário
        diario.estado = 'fechado'
        diario.dateClosed = new Date()
        diario.lastUpdated = new Date()
        diario.notas = notas ?: diario.notas
        diario.fechadoPor = currentUser?.username
        diario.saldoFinal = diario.saldo

        if (!diario.save(flush: true)) {
            throw new RuntimeException("Erro ao fechar diário: ${diario.errors}")
        }

        return [success: true, diario: diario, message: "Diário fechado com sucesso!"]
    }

/**
 * Atualizar totais do diário com base nas movimentações associadas
 */
    void atualizarTotais(Diario diario) {
        Calendar calInicio = Calendar.getInstance()
        calInicio.setTime(diario.dataReferencia)
        calInicio.set(Calendar.HOUR_OF_DAY, 0)
        calInicio.set(Calendar.MINUTE, 0)
        calInicio.set(Calendar.SECOND, 0)
        calInicio.set(Calendar.MILLISECOND, 0)

        Calendar calFim = Calendar.getInstance()
        calFim.setTime(calInicio.getTime())
        calFim.add(Calendar.DAY_OF_MONTH, 1)

        // Buscar pagamentos associados ao diário OU do dia
        def pagamentos = diario.pagamentos ?: Pagamento.createCriteria().list {
            between('dataPagamento', calInicio.getTime(), calFim.getTime())
        }

        // Buscar saídas associadas ao diário OU do dia
        def saidas = diario.saidas ?: SaidaCaixa.createCriteria().list {
            between('dataSaida', calInicio.getTime(), calFim.getTime())
        }

        BigDecimal totalRecebimentos = pagamentos?.sum { it.valorPago ?: 0 } ?: 0.0
        BigDecimal totalSaidas = saidas?.sum { it.valor ?: 0 } ?: 0.0

        diario.totalRecebimentos = totalRecebimentos
        diario.totalSaidas = totalSaidas
        diario.saldo = totalRecebimentos - totalSaidas
        diario.lastUpdated = new Date()

        if (!diario.save(flush: true)) {
            log.error "Erro ao atualizar totais: ${diario.errors}"
        }

        log.info "Diário ${diario.numeroDiario} - Rec: ${totalRecebimentos}, Saídas: ${totalSaidas}, Saldo: ${diario.saldo}"
    }

    /**
     * Reabrir diário fechado
     */
    Map reabrirDiario(Date dataReferencia, String motivo) {
        Diario diario = Diario.findByDataReferencia(dataReferencia)
        if (!diario) throw new RuntimeException("Diário não encontrado")
        if (diario.estado != 'fechado') throw new RuntimeException("Apenas diários fechados podem ser reabertos")

        def currentUser = springSecurityService?.currentUser

        diario.estado = 'pendente'
        diario.motivoReabertura = motivo
        diario.reabertoPor = currentUser?.username
        diario.lastUpdated = new Date()
        diario.dateClosed = null
        diario.fechadoPor = null
        diario.saldoFinal = null

        if (!diario.save(flush: true)) {
            throw new RuntimeException("Erro ao reabrir diário: ${diario.errors}")
        }

        return [success: true, diario: diario, message: "Diário reaberto como pendente"]
    }

    /**
     * Garantir que apenas UM diário esteja aberto
     * Fecha automaticamente qualquer diário aberto/pendente
     */
    void garantirUnicoDiarioAberto(Diario novoDiario) {
        def diariosAbertos = Diario.findAllByEstadoInList(['aberto', 'pendente'])

        diariosAbertos.each { diario ->
            if (diario.id != novoDiario?.id) {
                // Fechar automaticamente
                diario.estado = 'fechado'
                diario.dateClosed = new Date()
                diario.lastUpdated = new Date()
                diario.fechadoPor = 'SISTEMA (fecho automático)'
                diario.saldoFinal = diario.saldo

                if (!diario.save(flush: true)) {
                    log.error("Erro ao fechar diário ${diario.numeroDiario}: ${diario.errors}")
                } else {
                    log.info("Diário ${diario.numeroDiario} fechado automaticamente")
                }
            }
        }
    }

    /**
     * Obter o diário atualmente aberto (ou null)
     */
    Diario getDiarioAberto() {
        return Diario.findByEstadoInList(['aberto', 'pendente'], [max: 1, sort: 'dataReferencia', order: 'desc'])
    }

    /**
     * Atualizar totais do diário
     */


    /**
     * Formatar diário para resposta JSON
     */
    Map formatarDiario(Diario diario) {
        if (!diario) return null

        Calendar calInicio = Calendar.getInstance()
        calInicio.setTime(diario.dataReferencia)
        calInicio.set(Calendar.HOUR_OF_DAY, 0)
        calInicio.set(Calendar.MINUTE, 0)
        calInicio.set(Calendar.SECOND, 0)

        Calendar calFim = Calendar.getInstance()
        calFim.setTime(calInicio.getTime())
        calFim.add(Calendar.DAY_OF_MONTH, 1)

        def pagamentos = diario.pagamentos ?: Pagamento.createCriteria().list {
            between('dataPagamento', calInicio.getTime(), calFim.getTime())
        }
        def saidas = diario.saidas ?: SaidaCaixa.createCriteria().list {
            between('dataSaida', calInicio.getTime(), calFim.getTime())
        }

        def saidasAtivas = saidas.findAll { it.tipo in ['REEMBOLSO', 'FEICHO_CAIXA'] }
        def saidasPassivas = saidas.findAll { it.tipo in ['DESPESA', 'FORNECEDOR', 'SALARIO', 'MATERIAL', 'SERVICO', 'OUTRO'] }

        return [
                id: diario.id,
                numeroDiario: diario.numeroDiario,
                dataReferencia: diario.dataReferencia,
                estado: diario.estado,
                fechado: diario.estado == 'fechado',
                pendente: diario.estado == 'pendente',
                dateCreated: diario.dateCreated,
                dateClosed: diario.dateClosed,
                lastUpdated: diario.lastUpdated,
                fechadoPor: diario.fechadoPor,
                reabertoPor: diario.reabertoPor,
                motivoReabertura: diario.motivoReabertura,
                criadoPor: diario.criadoPor,
                notas: diario.notas,
                saldoFinal: diario.saldoFinal,
                recebimentos: pagamentos.collect { formatarPagamento(it) },
                saidasAtivas: saidasAtivas.collect { formatarSaida(it) },
                saidasPassivas: saidasPassivas.collect { formatarSaida(it) },
                totais: [
                        totalRecebimentos: diario.totalRecebimentos ?: 0.0,
                        totalSaidasAtivas: saidasAtivas.sum { it.valor ?: 0 } ?: 0.0,
                        totalSaidasPassivas: saidasPassivas.sum { it.valor ?: 0 } ?: 0.0,
                        totalSaidas: diario.totalSaidas ?: 0.0,
                        saldo: diario.saldo ?: 0.0,
                        saldoFinal: diario.saldoFinal
                ]
        ]
    }

    private Map formatarPagamento(Pagamento pagamento) {
        [
                id: pagamento.id,
                numeroRecibo: pagamento.numeroRecibo,
                nomeCliente: pagamento.entidade?.nome,
                descricao: pagamento.descricao,
                dataPagamento: pagamento.dataPagamento,
                formaPagamento: pagamento.formaPagamento,
                valorPago: pagamento.valorPago,
                utilizador: pagamento.usuario?.username ?: ''
        ]
    }

    private Map formatarSaida(SaidaCaixa saida) {
        [
                id: saida.id,
                dateCreated: saida.dateCreated,
                dataSaida: saida.dataSaida,
                dataPagamento: saida.dataSaida,
                descricao: saida.descricao,
                origem: saida.formaPagamento ?: '',
                destino: saida.tipo ?: '',
                tipo: saida.tipo,
                valor: saida.valor,
                utilizador: saida.usuario?.username ?: ''
        ]
    }
}