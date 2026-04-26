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

    /**
     * Mapeamento de nomes de recursos (URL) para nomes de entidades (Classe)
     * Chave: nome do recurso na URL (plural/camelCase)
     * Valor: nome da classe de domínio (singular/PascalCase)
     */
    static final Map<String, String> RESOURCE_TO_ENTITY = [
            'definicoesCredito': 'DefinicaoCredito',
            'creditos': 'Credito',
            'parcelas': 'Parcela',
            'entidades': 'Entidade',
            'taxas': 'Taxa',
            'feriados': 'Feriado',
            'produtos': 'Produto'
    ]

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

                        // 1. Tenta obter do mapeamento explícito
                        def entityName = RESOURCE_TO_ENTITY[resourceName]

                        if (!entityName) {
                            // 2. Fallback: tenta singularizar (remove 's', 'es', 'res')
                            entityName = singularize(resourceName).capitalize()
                        }

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

    /**
     * Tenta converter um nome de recurso plural para singular
     * Ex: definicoesCredito -> DefinicaoCredito
     *     creditos -> Credito
     *     entidades -> Entidade
     *     taxas -> Taxa
     *     feriados -> Feriado
     */
    private String singularize(String plural) {
        // Se já não termina com 's', retorna como está
        if (!plural.endsWith('s')) {
            return plural
        }

        // Remove terminações comuns de plural
        if (plural.endsWith('oes')) {
            // "definicoes" -> "definicao"
            return plural[0..-4] + 'ao'
        }
        if (plural.endsWith('aes')) {
            // "taxas" não chega aqui, é tratado pelo mapeamento
            return plural[0..-4] + 'ao'
        }
        if (plural.endsWith('res')) {
            // "entidades" não chega aqui, mas por segurança
            return plural[0..-4]
        }
        if (plural.endsWith('es')) {
            // "creditos" -> "Credito"
            return plural[0..-3]
        }
        if (plural.endsWith('s')) {
            // Caso geral: remove o 's' final
            return plural[0..-2]
        }

        return plural
    }

    boolean after() { true }
    void afterView() { }
}