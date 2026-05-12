package app.timali

import groovy.util.logging.Slf4j

@Slf4j
class UsuarioController {

    static responseFormats = ['json']

    UsuarioService usuarioService

    /**
     * GET /api/usuarios
     */
    def index() {
        try {
            def result = usuarioService.list(params)
            respond result
        } catch (Exception e) {
            log.error "Erro ao listar: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    /**
     * GET /api/usuarios/:id
     */
    def show() {
        try {
            Usuario usuario = usuarioService.getById(params.id)
            if (!usuario) {
                render(status: 404, contentType: "application/json") {
                    [error: "Usuário não encontrado"]
                }
                return
            }
            respond usuarioService.buildUsuarioMap(usuario)
        } catch (Exception e) {
            log.error "Erro ao buscar: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    /**
     * POST /api/usuarios
     */
    def save() {
        try {
            def result = usuarioService.save(request.JSON)

            if (result.success) {
                render(status: 201, contentType: "application/json") {
                    result.data
                }
            } else {
                render(status: 422, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro ao criar: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    /**
     * PUT /api/usuarios/:id
     */
    def update() {
        try {
            def result = usuarioService.update(params.id, request.JSON)

            if (result.success) {
                respond result.data
            } else {
                render(status: 422, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro ao atualizar: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    /**
     * DELETE /api/usuarios/:id
     */
    def delete() {
        try {
            def result = usuarioService.delete(params.id)

            if (result.success) {
                render(status: 204)
            } else {
                render(status: 404, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro ao deletar: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    /**
     * PUT /api/usuarios/:id/roles
     */
    def updateRoles() {
        try {
            def data = request.JSON
            def result = usuarioService.updateRoles(params.id as Long, data.roleIds as List<Long>)

            if (result.success) {
                respond result.data
            } else {
                render(status: 422, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro ao atualizar roles: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    /**
     * PUT /api/usuarios/:id/groups
     */
    def updateGroups() {
        try {
            def data = request.JSON
            def result = usuarioService.updateGroups(params.id as Long, data.groupIds as List<Long>)

            if (result.success) {
                respond result.data
            } else {
                render(status: 422, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro ao atualizar grupos: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }

    /**
     * PUT /api/usuarios/:id/toggleStatus
     */
    def toggleStatus() {
        try {
            def result = usuarioService.toggleStatus(params.id)

            if (result.success) {
                respond result.data
            } else {
                render(status: 404, contentType: "application/json") {
                    [error: result.error]
                }
            }
        } catch (Exception e) {
            log.error "Erro ao alterar status: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }
}