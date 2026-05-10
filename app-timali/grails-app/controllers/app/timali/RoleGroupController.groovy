package app.timali

import app.timali.RoleGroup
import groovy.util.logging.Slf4j

@Slf4j
class RoleGroupController {

    static responseFormats = ['json']

    def index() {
        log.info "=== RoleGroupController.index() CHAMADO ==="

        try {
            def groups = RoleGroup.list()
            log.info "Grupos encontrados: ${groups.size()}"

            def result = groups.collect { group ->
                [
                        id: group.id,
                        name: group.name,
                        description: group.description,
                        roles: group.roles?.collect { role ->
                            [id: role.id, authority: role.authority]
                        } ?: [],
                        totalRoles: group.roles?.size() ?: 0
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
}