// grails-app/controllers/app/timali/SettingsController.groovy

package app.timali

import grails.rest.RestfulController

class SettingsController extends RestfulController<Settings> {

    static responseFormats = ['json']

    SettingsService settingsService

    SettingsController() {
        super(Settings)
    }

    @Override
    def index() {
            def settings = Settings.first()  // ou Settings.list().first()
            if (settings) {
                respond settings
            } else {
                render status: 404
            }
    }



    @Override
    def show() {
        def id = params.id
        def settingsInstance = id ? Settings.get(id) : Settings.first()
        if (settingsInstance) {
            respond settingsInstance
        } else {
            notFound()
        }
    }


    // grails-app/controllers/app/timali/SettingsController.groovy

    @Override
    def update() {
        def settings = params.id ? Settings.get(params.id) : Settings.first()
        if (!settings) {
            notFound()
            return
        }

        // Atualizar apenas campos existentes
        if (request.JSON.nome != null) settings.nome = request.JSON.nome
        if (request.JSON.permitirDesembolsoComDivida != null) settings.permitirDesembolsoComDivida = request.JSON.permitirDesembolsoComDivida
        if (request.JSON.alterarDataPagamento != null) settings.alterarDataPagamento = request.JSON.alterarDataPagamento
        if (request.JSON.pagamentosEmOrdem != null) settings.pagamentosEmOrdem = request.JSON.pagamentosEmOrdem
        if (request.JSON.pagarEmSequencia != null) settings.pagarEmSequencia = request.JSON.pagarEmSequencia
        if (request.JSON.ignorarValorPagoNoPrazo != null) settings.ignorarValorPagoNoPrazo = request.JSON.ignorarValorPagoNoPrazo
        if (request.JSON.conta1 != null) settings.conta1 = request.JSON.conta1
        if (request.JSON.conta2 != null) settings.conta2 = request.JSON.conta2
        if (request.JSON.conta3 != null) settings.conta3 = request.JSON.conta3

        settings.save(flush: true, failOnError: true)
        settingsService?.clearCache()

        respond settings
    }
}