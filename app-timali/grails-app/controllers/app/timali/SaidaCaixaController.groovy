// grails-app/controllers/app/timali/SaidaCaixaController.groovy
package app.timali

import grails.converters.JSON
import grails.rest.RestfulController
import grails.gorm.transactions.Transactional
import java.text.SimpleDateFormat

class SaidaCaixaController extends RestfulController<SaidaCaixa> {
    DiarioCaixaService diarioCaixaService  // Injetar o service
    static responseFormats = ['json']

    def springSecurityService

    SaidaCaixaController() {
        super(SaidaCaixa)
    }

    private void associarSaidaAoDiario(SaidaCaixa saida) {
        if (!saida.dataSaida) {
            log.warn "Saída sem data, usando data atual"
            saida.dataSaida = new Date()
        }

        // ***** Usar a data da SAÍDA, não a data atual *****
        Calendar cal = Calendar.getInstance()
        cal.setTime(saida.dataSaida)  // ← data da saída
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        Date dataLimpa = cal.getTime()

        // Buscar ou criar diário PARA A DATA DA SAÍDA
        Diario diario = Diario.findByDataReferencia(dataLimpa)
        if (!diario) {
            diario = new Diario()
            diario.dataReferencia = dataLimpa
            diario.estado = 'aberto'
            diario.numeroDiario = diarioCaixaService.gerarDadosDiario(dataLimpa)
            diario.totalRecebimentos = 0.0
            diario.totalSaidas = 0.0
            diario.saldo = 0.0
            diario.dateCreated = new Date()
            diario.lastUpdated = new Date()
            diario.criadoPor = saida.criadoPor

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

        // Associar saída ao diário da data correta
        saida.diario = diario
        saida.save(flush: true)
        // Associar ao diário
        diarioCaixaService.associarSaidaAoDiario(saida)
        if (!diario.saidas?.contains(saida)) {
            diario.addToSaidas(saida)
        }

        diario.totalRecebimentos = diario.pagamentos?.sum { it.valorPago ?: 0 } ?: 0.0
        diario.totalSaidas = diario.saidas?.sum { it.valor ?: 0 } ?: 0.0
        diario.saldo = diario.totalRecebimentos - diario.totalSaidas
        diario.lastUpdated = new Date()
        diario.save(flush: true)

        log.info("Saída ${saida.id} associada ao diário ${diario.numeroDiario} (data: ${dataLimpa.format('dd/MM/yyyy')})")
    }


    @Transactional
    def save() {
        def instance = createResource()

        def currentUser = springSecurityService?.currentUser
        if (currentUser) {
            instance.usuario = currentUser
            if (!instance.criadoPor) {
                instance.criadoPor = currentUser.username
            }
        }

        if (!instance.save(flush: true)) {
            respond instance.errors, status: 422
            return
        }
        diarioCaixaService.associarSaidaAoDiario(instance)
        respond instance, status: 201
    }

    def saidasPorPeriodo() {
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

        def saidas = SaidaCaixa.createCriteria().list {
            between('dataSaida', dataInicio, dataFimAjustada)
            if (params.tipo) eq('tipo', params.tipo)
            order('dataSaida', 'desc')
            maxResults(200)
        }

        render(saidas as JSON)
    }

    def resumoSaidas() {
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

        def saidas = SaidaCaixa.createCriteria().list {
            between('dataSaida', dataInicio, dataFimAjustada)
        }

        BigDecimal total = saidas.sum { it.valor ?: 0 } ?: 0

        def porTipo = [:]
        saidas.groupBy { it.tipo }.each { tipo, lista ->
            porTipo[tipo] = [quantidade: lista.size(), total: lista.sum { it.valor ?: 0 }]
        }

        def resultado = [totalSaidas: saidas.size(), valorTotal: total, porTipo: porTipo]
        render(resultado as JSON)
    }
}