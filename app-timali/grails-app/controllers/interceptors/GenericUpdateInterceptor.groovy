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
            println "RequestURI: ${request.requestURI}"
            println "ServletPath: ${request.servletPath}"
            println "Params ID: ${params.id}"
            println "▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓"
            println ""

            def id = params.id?.toLong()

            if (id && request.JSON) {
                try {
                    // Usar request.requestURI em vez de request.uri
                    def uri = request.requestURI ?: request.servletPath

                    if (!uri) {
                        println "⚠️ URI não disponível, usando 'entidade' como padrão"
                        def updatedEntity = genericUpdateService.update("Entidade", id, request.JSON)
                        render updatedEntity as JSON
                        return false
                    }

                    def pathParts = uri.split('/')

                    if (pathParts.length >= 3) {
                        def resourceName = pathParts[2]
                        def entityName = resourceName.capitalize()
                        if (entityName.endsWith('s')) {
                            entityName = entityName.substring(0, entityName.length() - 1)
                        }

                        println ">>> Entidade detectada: ${entityName}"
                        println ">>> Chamando GenericUpdateService.update(${entityName}, ${id}, ...)"

                        def updatedEntity = genericUpdateService.update(entityName, id, request.JSON)

                        response.status = 200
                        response.contentType = 'application/json'
                        render updatedEntity as JSON

                        return false
                    }
                } catch (Exception e) {
                    println "❌ ERRO: ${e.message}"
                    e.printStackTrace()
                }
            }
        }
        return true
    }

    boolean after() { true }
    void afterView() { }
}