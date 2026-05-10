package app.timali

import groovy.util.logging.Slf4j

@Slf4j
class RoleController {

    static responseFormats = ['json']

    def index() {
        log.info "=== RoleController.index() CHAMADO ==="

        try {
            def roles = Role.list()
            log.info "Roles encontradas: ${roles.size()}"

            def result = roles.collect { role ->
                [
                        id: role.id,
                        authority: role.authority
                ]
            }

            log.info "Retornando JSON: ${result}"
            respond result
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    def show() {
        try {
            Role role = Role.get(params.id)
            if (!role) {
                render(status: 404, contentType: "application/json") {
                    [error: "Role não encontrada"]
                }
                return
            }

            respond([id: role.id, authority: role.authority])
        } catch (Exception e) {
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }
}