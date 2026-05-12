// grails-app/controllers/app/timali/DocumentoController.groovy
package app.timali

import grails.converters.JSON
import grails.plugin.springsecurity.SpringSecurityService
import static org.springframework.http.HttpStatus.*

class DocumentoController {

    DocumentoService documentoService
    SpringSecurityService springSecurityService

    static responseFormats = ['json', 'multipart']

    // GET /api/documentos?entidadeId=123
    def index(Long entidadeId) {
        if (!entidadeId) {
            render status: BAD_REQUEST
            return
        }
        List<Documento> docs = documentoService.listarPorEntidade(entidadeId)
        respond docs.collect { documentoService.formatarParaJson(it) }
    }

    // GET /api/documentos/:id
    def show(Long id) {
        Documento doc = Documento.get(id)
        if (!doc) {
            render status: NOT_FOUND, text: [error: 'Documento não encontrado'] as JSON
            return
        }
        respond documentoService.formatarParaJson(doc)
    }

    // GET /api/documentos/:id/download
    def download(Long id) {
        Map dados = documentoService.download(id)
        if (!dados) {
            render status: NOT_FOUND
            return
        }

        response.setContentType("application/octet-stream")
        response.setHeader("Content-Disposition", "attachment; filename=\"${dados.nome}\"")
        response.outputStream << dados.conteudo
        response.outputStream.flush()
    }

    // POST /api/documentos/upload
    def upload() {
        Long entidadeId = params.long('entidadeId')
        String tipo = params.tipo
        String descricao = params.descricao

        def arquivo = request.getFile('arquivo')
        if (!arquivo || arquivo.empty) {
            render status: BAD_REQUEST, text: [error: 'Arquivo não enviado'] as JSON
            return
        }

        // Pegar usuário logado pelo Spring Security
        Usuario usuario = springSecurityService.currentUser as Usuario

        if (!usuario) {
            render status: UNAUTHORIZED, text: [error: 'Usuário não autenticado'] as JSON
            return
        }

        try {
            Documento doc = documentoService.upload(entidadeId, arquivo, tipo, descricao, usuario)
            respond documentoService.formatarParaJson(doc), [status: CREATED]
        } catch (Exception e) {
            log.error("Erro no upload de documento", e)
            render status: INTERNAL_SERVER_ERROR, text: [error: e.message] as JSON
        }
    }

    // DELETE /api/documentos/:id
    def delete(Long id) {
        try {
            documentoService.excluir(id)
            render status: NO_CONTENT
        } catch (Exception e) {
            log.error("Erro ao excluir documento", e)
            render status: INTERNAL_SERVER_ERROR, text: [error: e.message] as JSON
        }
    }
}