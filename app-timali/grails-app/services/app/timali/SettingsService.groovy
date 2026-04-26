package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.transactions.Transactional

@GrailsCompileStatic
@Transactional
class SettingsService {

    // Cache em memória para evitar múltiplas consultas
    private Settings cachedSettings

    Settings getSettings() {
        if (!cachedSettings) {
            cachedSettings = Settings.instance
        }
        return cachedSettings
    }

    void clearCache() {
        cachedSettings = null
    }

    Settings updateSettings(Map params) {
        Settings settings = getSettings()
        settings.properties = params
        settings.save(flush: true, failOnError: true)
        clearCache() // Limpa cache após atualização
        return settings
    }

    // Métodos de conveniência para verificações comuns
    boolean isPermitirDesembolsoComDivida() {
        return getSettings().permitirDesembolsoComDivida ?: false
    }

    boolean isPagamentosEmOrdem() {
        return getSettings().pagamentosEmOrdem ?: false
    }

    boolean isIgnorarValorPagoNoPrazo() {
        return getSettings().ignorarValorPagoNoPrazo ?: false
    }

    boolean isPagarEmSequencia() {
        return getSettings().pagarEmSequencia ?: false
    }

    boolean isAlterarDataPagamento() {
        return getSettings().alterarDataPagamento ?: false
    }

    String getConta1() {
        return getSettings().conta1
    }

    String getConta2() {
        return getSettings().conta2
    }

    String getConta3() {
        return getSettings().conta3
    }

    String getRodaPePlanoDePagamento() {
        return getSettings().rodaPePlanoDePagamento
    }

    String getNbPlanoDePagamento() {
        return getSettings().nbPlanoDePagamento
    }
}