// grails-app/jobs/app/timali/AtualizarMorasJob.groovy
package app.timali

class AtualizarMorasJob {

    CreditoService creditoService

    static triggers = {
        cron name: 'atualizarMoras', cronExpression: '0 0 6 * * ?' // Todo dia às 6h
    }

    def execute() {
        log.info("🔄 Job: Atualizando moras...")
        creditoService.recalcularMorasTodosCreditos()
    }
}