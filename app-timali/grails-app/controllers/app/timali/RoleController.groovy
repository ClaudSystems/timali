package app.timali

import groovy.util.logging.Slf4j

@Slf4j
class RoleController {

    static responseFormats = ['json']

    RoleService roleService

    def index() {
        try {
            def roles = roleService.list(params)
            def result = roles.collect { role ->
                [id: role.id, authority: role.authority]
            }
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
            Role role = roleService.getById(params.id)
            if (!role) {
                render(status: 404, contentType: "application/json") {
                    [error: "Role não encontrada"]
                }
                return
            }
            // CORREÇÃO: Chamar respond com a variável
            def result = [id: role.id, authority: role.authority]
            respond result

        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    def save() {
        try {
            def result = roleService.save(request.JSON)
            if (result.success) {
                def data = [id: result.data.id, authority: result.data.authority]
                render(status: 201, contentType: "application/json", text: groovy.json.JsonOutput.toJson(data))
            } else {
                render(status: 422, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    def update() {
        try {
            def result = roleService.update(params.id, request.JSON)
            if (result.success) {
                def data = [id: result.data.id, authority: result.data.authority]
                render(contentType: "application/json", text: groovy.json.JsonOutput.toJson(data))
            } else {
                render(status: 422, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    def delete() {
        try {
            def result = roleService.delete(params.id)
            if (result.success) {
                render(status: 204)
            } else {
                render(status: 404, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    def initDefaults() {
        try {
            def result = roleService.createDefaultRoles()
            render(contentType: "application/json", text: groovy.json.JsonOutput.toJson(result))
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }
}