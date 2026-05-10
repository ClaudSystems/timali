// grails-app/controllers/app/timali/DiarioController.groovy
package app.timali

import grails.converters.JSON
import grails.rest.RestfulController
import grails.gorm.transactions.Transactional

class DiarioController extends RestfulController<Diario> {

    static responseFormats = ['json']

    def springSecurityService
    DiarioCaixaService diarioCaixaService

    DiarioController() { super(Diario) }

    def index(Integer max) {
        params.max = Math.min(max ?: 50, 200)
        def diarios = Diario.listOrderByDataReferencia('desc', params)
        render diarioCaixaService.formatarDiariosParaListagem(diarios) as JSON
    }

    def verificar() {
        Date data = diarioCaixaService.parseDate(params.data as String)
        if (!data) { render status: 400, text: [message: "Formato de data inválido"] as JSON; return }
        Date dataLimpa = diarioCaixaService.getDayStart(data)
        Diario diario = Diario.findByDataReferencia(dataLimpa)
        if (diario) {
            render([existe: true, diario: diarioCaixaService.formatarDiario(diario)] as JSON)
        } else {
            render([existe: false] as JSON)
        }
    }

    def buscar() {
        Date data = diarioCaixaService.parseDate(params.data as String)
        if (!data) { render status: 400, text: [message: "Formato de data inválido"] as JSON; return }
        Date dataLimpa = diarioCaixaService.getDayStart(data)
        Diario diario = Diario.findByDataReferencia(dataLimpa)
        if (diario) {
            render diarioCaixaService.formatarDiario(diario) as JSON
        } else {
            Map range = diarioCaixaService.getDayRange(dataLimpa)
            def pagamentos = diarioCaixaService.buscarPagamentos(range.inicio, range.fim)
            def saidas = diarioCaixaService.buscarSaidas(range.inicio, range.fim)
            render status: 404, text: [
                    message: "Nenhum diário encontrado",
                    temPagamentos: pagamentos.size() > 0,
                    temSaidas: saidas.size() > 0,
                    totalPagamentos: pagamentos.size(),
                    totalSaidas: saidas.size()
            ] as JSON
        }
    }

    @Transactional
    def gerarDiario() {
        Date data = diarioCaixaService.parseDate(params.data as String) ?: new Date()
        Date dataLimpa = diarioCaixaService.getDayStart(data)
        Date hoje = diarioCaixaService.getDayStart(new Date())

        if (dataLimpa.after(hoje)) {
            render status: 400, text: [message: "Não é possível gerar diário para data futura"] as JSON
            return
        }

        Diario existente = Diario.findByDataReferencia(dataLimpa)
        if (existente) {
            Map resultado = diarioCaixaService.formatarDiario(existente)
            resultado.mensagem = "Diário existente carregado"
            render resultado as JSON
            return
        }

        Diario diario = diarioCaixaService.gerarDiario(dataLimpa)
        if (!diario) { render status: 500, text: [message: "Erro ao gerar"] as JSON; return }
        Map resultado = diarioCaixaService.formatarDiario(diario)
        resultado.mensagem = "Diário gerado com sucesso!"
        render resultado as JSON
    }

    /**
     * POST /api/diarios/fechar
     * Fecha o diário (pode lançar saída do saldo)
     */
    @Transactional
    def fecharDiario() {
        def jsonData = request.JSON
        Date dataRef = diarioCaixaService.parseDate(jsonData.dataReferencia as String)
        if (!dataRef) { render status: 400, text: [message: "Data inválida"] as JSON; return }

        Date dataLimpa = diarioCaixaService.getDayStart(dataRef)
        Diario diario = Diario.findByDataReferencia(dataLimpa)
        if (!diario) { render status: 404, text: [message: "Diário não encontrado"] as JSON; return }
        if (diario.estado == 'fechado') { render status: 409, text: [message: "Diário já fechado"] as JSON; return }

        try {
            Boolean lancarSaida = jsonData.lancarSaida as Boolean ?: false
            String forma = jsonData.formaPagamento as String ?: 'DINHEIRO'
            String notas = jsonData.notas as String

            diarioCaixaService.fecharDiario(diario, notas, lancarSaida, forma)
            Map resultado = diarioCaixaService.formatarDiario(diario)
            resultado.mensagem = "Diário fechado com sucesso"
            render resultado as JSON
        } catch (Exception e) {
            render status: 500, text: [message: e.message] as JSON
        }
    }

    /**
     * POST /api/diarios/reabrir
     */
    @Transactional
    def reabrir() {
        def jsonData = request.JSON
        Date dataRef = diarioCaixaService.parseDate(jsonData.dataReferencia as String)
        if (!dataRef) { render status: 400, text: [message: "Data inválida"] as JSON; return }

        Date dataLimpa = diarioCaixaService.getDayStart(dataRef)
        Diario diario = Diario.findByDataReferencia(dataLimpa)
        if (!diario) { render status: 404, text: [message: "Diário não encontrado"] as JSON; return }
        if (diario.estado != 'fechado') { render status: 400, text: [message: "Diário não está fechado"] as JSON; return }

        try {
            diarioCaixaService.reabrirDiario(diario)
            Map resultado = diarioCaixaService.formatarDiario(diario)
            resultado.mensagem = "Diário reaberto com sucesso"
            render resultado as JSON
        } catch (Exception e) {
            render status: 500, text: [message: e.message] as JSON
        }
    }

    /**
     * PUT /api/diarios/{id} - Update genérico
     */
    @Transactional
    def update() {
        Diario diario = Diario.get(params.id)
        if (!diario) { render status: 404, text: [message: "Diário não encontrado"] as JSON; return }

        // Se está mudando estado para 'aberto', delegar ao reabrirDiario
        if (request.JSON.estado == 'aberto' && diario.estado == 'fechado') {
            diarioCaixaService.reabrirDiario(diario)
        } else {
            diario.properties = request.JSON
            if (!diario.save(flush: true)) {
                render status: 422, text: [errors: diario.errors] as JSON
                return
            }
        }

        render diarioCaixaService.formatarDiario(diario) as JSON
    }

    def diariosPorPeriodo() {
        def dataUtilService = grails.util.Holders.grailsApplication.mainContext.getBean('dataUtilService')
        def periodo = dataUtilService.extrairPeriodo(params)
        Date dataInicio = periodo.dataInicio
        Date dataFim = dataUtilService.fimDoPeriodo(periodo.dataFim)
        def diarios = Diario.createCriteria().list {
            between('dataReferencia', dataInicio, dataFim)
            order('dataReferencia', 'desc')
            maxResults(100)
        }
        render(diarios as JSON)
    }

    @Transactional
    def delete(Long id) {
        def diario = Diario.get(id)
        if (!diario) { render status: 404, text: [message: "Diário não encontrado"] as JSON; return }
        diario.delete(flush: true)
        render status: 200, text: [message: "Diário excluído"] as JSON
    }
}