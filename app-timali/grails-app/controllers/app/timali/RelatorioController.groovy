// grails-app/controllers/app/timali/RelatorioController.groovy
package app.timali

import grails.converters.JSON
import java.text.SimpleDateFormat

class RelatorioController {

    def relatorioService

    /**
     * GET /api/relatorios/creditosEmitidos?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
     */
    def creditosEmitidos() {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat('yyyy-MM-dd')
            Date dataInicio = params.dataInicio ? sdf.parse(params.dataInicio) : (new Date() - 30)
            Date dataFim = params.dataFim ? sdf.parse(params.dataFim) : new Date()

            def resultado = relatorioService.creditosEmitidosPorPeriodo(dataInicio, dataFim)
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de créditos emitidos: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/creditosPorGestor?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD&gestor=xxx
     */
    def creditosPorGestor() {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat('yyyy-MM-dd')
            Date dataInicio = params.dataInicio ? sdf.parse(params.dataInicio) : (new Date() - 30)
            Date dataFim = params.dataFim ? sdf.parse(params.dataFim) : new Date()
            String gestor = params.gestor

            def resultado = relatorioService.creditosPorGestor(dataInicio, dataFim, gestor)
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório por gestor: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/prestacoesPorVencimento?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
     */
    def prestacoesPorVencimento() {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat('yyyy-MM-dd')
            Date dataInicio = params.dataInicio ? sdf.parse(params.dataInicio) : (new Date() - 30)
            Date dataFim = params.dataFim ? sdf.parse(params.dataFim) : new Date()

            def resultado = relatorioService.prestacoesPorVencimento(dataInicio, dataFim)
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de prestações: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/pagamentosRecebidos?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
     */
    def pagamentosRecebidos() {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat('yyyy-MM-dd')
            Date dataInicio = params.dataInicio ? sdf.parse(params.dataInicio) : (new Date() - 30)
            Date dataFim = params.dataFim ? sdf.parse(params.dataFim) : new Date()

            def resultado = relatorioService.pagamentosRecebidos(dataInicio, dataFim)
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de pagamentos: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/saidas?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
     */
    def saidas() {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat('yyyy-MM-dd')
            Date dataInicio = params.dataInicio ? sdf.parse(params.dataInicio) : (new Date() - 30)
            Date dataFim = params.dataFim ? sdf.parse(params.dataFim) : new Date()

            def resultado = relatorioService.saidasPorPeriodo(dataInicio, dataFim)
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de saídas: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/diarios?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
     */
    def diarios() {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat('yyyy-MM-dd')
            Date dataInicio = params.dataInicio ? sdf.parse(params.dataInicio) : (new Date() - 30)
            Date dataFim = params.dataFim ? sdf.parse(params.dataFim) : new Date()

            def resultado = relatorioService.diariosPorPeriodo(dataInicio, dataFim)
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de diários: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/creditosEmMora
     */
    def creditosEmMora() {
        try {
            def resultado = relatorioService.creditosEmMora()
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de mora: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/usuarios
     */
    def usuarios() {
        try {
            def resultado = relatorioService.todosUsuarios()
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de usuários: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/usuariosComCreditos
     */
    def usuariosComCreditos() {
        try {
            def resultado = relatorioService.usuariosComCreditosAtivos()
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de usuários com créditos: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/clientesComAtrasos
     */
    def clientesComAtrasos() {
        try {
            def resultado = relatorioService.clientesComAtrasos()
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro no relatório de clientes com atrasos: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/avaliarCliente/{clienteId}
     */
    def avaliarCliente(Long clienteId) {
        try {
            if (!clienteId) {
                render status: 400, text: [message: "ID do cliente obrigatório"] as JSON
                return
            }

            def avaliacao = relatorioService.avaliarPontualidadeCliente(clienteId)
            if (!avaliacao) {
                render status: 404, text: [message: "Cliente não encontrado ou sem histórico"] as JSON
                return
            }

            render(avaliacao as JSON)
        } catch (Exception e) {
            println "❌ Erro na avaliação do cliente: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/dashboardAnalitico
     */
    def dashboardAnalitico() {
        try {
            def dados = relatorioService.dashboardAnalitico()
            render(dados as JSON)
        } catch (Exception e) {
            println "❌ Erro no dashboard analítico: ${e.message}"
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }

    /**
     * GET /api/relatorios/gestores
     */
    def gestores() {
        try {
            def resultado = relatorioService.getGestores()
            render(resultado as JSON)
        } catch (Exception e) {
            println "❌ Erro ao buscar gestores: ${e.message}"
            e.printStackTrace()
            render status: 500, text: [message: "Erro: ${e.message}"] as JSON
        }
    }
}
