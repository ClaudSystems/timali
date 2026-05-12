// grails-app/controllers/app/timali/EntidadeController.groovy
package app.timali

import grails.converters.JSON
import static org.springframework.http.HttpStatus.*

class EntidadeController {

    EntidadeService entidadeService

    static responseFormats = ['json']

    def index(Integer max) {
        params.max = Math.min(max ?: 50, 100)
        List<Entidade> entidades = entidadeService.list(params)
        respond entidadeService.formatarListaParaJson(entidades)
    }

    def show(Long id) {
        Entidade entidade = entidadeService.get(id)
        if (!entidade) {
            render status: NOT_FOUND, text: [message: 'Entidade não encontrada'] as JSON
            return
        }
        respond entidadeService.formatarParaJson(entidade)
    }

    def save() {
        // Converter JSONObject para Map manualmente
        Map data = [:]
        request.JSON.each { key, value ->
            data[key as String] = value
        }

        if (data.tipoDePessoa instanceof Map) data.tipoDePessoa = data.tipoDePessoa.name
        if (data.classificacao instanceof Map) data.classificacao = data.classificacao.name

        Entidade entidade = entidadeService.save(data)
        respond entidadeService.formatarParaJson(entidade), [status: CREATED]
    }
    def update(Long id) {
        Map data = request.JSON as Map

        Entidade entidade = entidadeService.atualizar(id, data)
        if (!entidade) {
            render status: NOT_FOUND, text: [message: 'Entidade não encontrada'] as JSON
            return
        }
        respond entidadeService.formatarParaJson(entidade)
    }

    def delete(Long id) {
        entidadeService.delete(id)
        render status: NO_CONTENT
    }

    def search(String q) {
        List<Entidade> entidades = entidadeService.search(q)
        respond entidadeService.formatarListaParaJson(entidades)
    }

    def verificarCodigo() {
        String codigo = params.codigo
        boolean disponivel = Entidade.isCodigoDisponivel(codigo)
        respond([disponivel: disponivel, codigo: codigo])
    }
}