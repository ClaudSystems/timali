// grails-app/controllers/app/timali/GenericUpdateInterceptor.groovy
package app.timali

import grails.artefact.Interceptor
import grails.converters.JSON
import org.springframework.beans.factory.annotation.Autowired

class GenericUpdateInterceptor implements Interceptor {

    int order = HIGHEST_PRECEDENCE

    @Autowired
    GenericUpdateService genericUpdateService

    GenericUpdateInterceptor() {
        match(uri: '/api/**')
    }

    boolean before() {
        if (request.method in ['PUT', 'PATCH']) {
            println ""
            println "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
            println "▓▓▓ GENERIC INTERCEPTOR CAPTUROU! ▓▓▓"
            println "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
            println "Method: ${request.method}"
            println "RequestURI: ${request.requestURI}"
            println "Params ID: ${params.id}"
            println "JSON Recebido: ${request.JSON}"
            println "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
            println ""

            def id = params.id?.toLong()

            if (id && request.JSON) {
                try {
                    def uri = request.requestURI ?: request.servletPath

                    if (!uri) {
                        println "⚠️ URI não disponível"
                        render status: 400, text: 'URI não disponível'
                        return false
                    }

                    def pathParts = uri.split('/')

                    if (pathParts.length >= 3) {
                        def resourceName = pathParts[2]
                        // Remove 's' do final para singular
                        def entityName = resourceName.endsWith('s') ?
                                resourceName[0..-2].capitalize() :
                                resourceName.capitalize()

                        println ">>> Recurso: ${resourceName}"
                        println ">>> Entidade: ${entityName}"
                        println ">>> Chamando GenericUpdateService.update(${entityName}, ${id}, ...)"

                        def updatedEntity = genericUpdateService.update(entityName, id, request.JSON)

                        if (updatedEntity) {
                            response.status = 200
                            response.contentType = 'application/json'
                            render updatedEntity as JSON
                        } else {
                            render status: 404, text: "Entidade não encontrada: ${entityName} com id ${id}"
                        }

                        return false
                    } else {
                        println "❌ URL mal formatada: ${uri}"
                        render status: 400, text: 'URL mal formatada'
                        return false
                    }
                } catch (ClassNotFoundException e) {
                    println "❌ Entidade não encontrada: ${e.message}"
                    render status: 404, text: "Entidade não encontrada"
                    return false
                } catch (Exception e) {
                    println "❌ ERRO NO INTERCEPTOR: ${e.message}"
                    e.printStackTrace()
                    render status: 500, text: "Erro interno: ${e.message}"
                    return false
                }
            } else {
                println "⚠️ ID ou JSON não fornecidos"
                render status: 400, text: 'ID e JSON são obrigatórios'
                return false
            }
        }
        return true
    }

    boolean after() { true }
    void afterView() { }
}