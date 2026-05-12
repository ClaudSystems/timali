package app.timali

import groovy.util.logging.Slf4j

@Slf4j
class RoleGroupController {

    static responseFormats = ['json']

    RoleGroupService roleGroupService

    def index() {
        try {
            def groups = roleGroupService.list(params)
            respond groups.collect { roleGroupService.toMap(it) }
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") { [error: e.message] }
        }
    }

    def show() {
        try {
            RoleGroup group = roleGroupService.getById(params.id)
            if (!group) {
                render(status: 404, contentType: "application/json") { [error: "Grupo não encontrado"] }
                return
            }
            respond roleGroupService.toMap(group)
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") { [error: e.message] }
        }
    }

    def save() {
        try {
            def result = roleGroupService.save(request.JSON)
            if (result.success) {
                render(status: 201, contentType: "application/json") {
                    roleGroupService.toMap(result.data)
                }
            } else {
                render(status: 422, contentType: "application/json") { [error: result.error] }
            }
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") { [error: e.message] }
        }
    }

    def update() {
        try {
            def result = roleGroupService.update(params.id, request.JSON)
            if (result.success) {
                respond roleGroupService.toMap(result.data)
            } else {
                render(status: 422, contentType: "application/json") { [error: result.error] }
            }
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") { [error: e.message] }
        }
    }

    def delete() {
        try {
            def result = roleGroupService.delete(params.id)
            if (result.success) {
                render(status: 204)
            } else {
                render(status: 404, contentType: "application/json") { [error: result.error] }
            }
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") { [error: e.message] }
        }
    }

    def initDefaults() {
        try {
            def result = roleGroupService.createDefaultGroups()
            respond result
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") { [error: e.message] }
        }
    }
}