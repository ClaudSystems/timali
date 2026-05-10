// grails-app/controllers/app/timali/EntidadeController.groovy
package app.timali

import grails.converters.JSON
import static org.springframework.http.HttpStatus.*

class EntidadeController {

    EntidadeService entidadeService

    static responseFormats = ['json']

    // GET /api/entidades
    def index(Integer max) {
        params.max = Math.min(max ?: 50, 100)
        List<Entidade> entidades = entidadeService.list(params)
        respond entidadeService.formatarListaParaJson(entidades)
    }

    // GET /api/entidades/:id
    def show(Long id) {
        Entidade entidade = entidadeService.get(id)
        if (!entidade) {
            render status: NOT_FOUND, text: [message: 'Entidade não encontrada'] as JSON
            return
        }
        respond entidadeService.formatarParaJson(entidade)
    }

    // POST /api/entidades
    def save() {
        Map data = request.JSON

        // Extrair valores de enum se vierem como objeto
        if (data.tipoDePessoa instanceof Map) data.tipoDePessoa = data.tipoDePessoa.name
        if (data.classificacao instanceof Map) data.classificacao = data.classificacao.name
        if (data.genero instanceof Map) data.genero = data.genero.name
        if (data.estadoCivil instanceof Map) data.estadoCivil = data.estadoCivil.name
        if (data.tipoDeIdentificao instanceof Map) data.tipoDeIdentificao = data.tipoDeIdentificao.name

        Entidade entidade = entidadeService.save(data)
        respond entidadeService.formatarParaJson(entidade), [status: CREATED]
    }

    // PUT /api/entidades/:id
    def update(Long id) {
        Map data = request.JSON

        // Extrair valores de enum se vierem como objeto
        if (data.tipoDePessoa instanceof Map) data.tipoDePessoa = data.tipoDePessoa.name
        if (data.classificacao instanceof Map) data.classificacao = data.classificacao.name
        if (data.genero instanceof Map) data.genero = data.genero.name
        if (data.estadoCivil instanceof Map) data.estadoCivil = data.estadoCivil.name
        if (data.tipoDeIdentificao instanceof Map) data.tipoDeIdentificao = data.tipoDeIdentificao.name

        Entidade entidade = entidadeService.update(id, data)
        if (!entidade) {
            render status: NOT_FOUND, text: [message: 'Entidade não encontrada'] as JSON
            return
        }
        respond entidadeService.formatarParaJson(entidade)
    }

    // DELETE /api/entidades/:id
    def delete(Long id) {
        entidadeService.delete(id)
        render status: NO_CONTENT
    }

    // GET /api/entidades/search?q=xxx
    def search(String q) {
        List<Entidade> entidades = entidadeService.search(q)
        respond entidadeService.formatarListaParaJson(entidades)
    }

    // GET /api/entidades/verificarCodigo?codigo=xxx
    def verificarCodigo() {
        String codigo = params.codigo
        boolean disponivel = Entidade.isCodigoDisponivel(codigo)
        Map resultado = [disponivel: disponivel, codigo: codigo]
        respond resultado
    }
}