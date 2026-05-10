package app.timali.api

import app.timali.Usuario
import app.timali.UsuarioService
import grails.rest.RestfulController
import groovy.util.logging.Slf4j

@Slf4j
class UsuarioController extends RestfulController<Usuario> {

    static responseFormats = ['json']

    UsuarioService usuarioService

    UsuarioController() {
        super(Usuario)
    }


    /**
     * PUT /api/usuarios/:id/groups
     * Atualiza os grupos de um usuário
     */
    def updateGroups() {
        try {
            def data = request.JSON
            def result = usuarioService.updateGroups(params.id as Long, data.groupIds ?: [])

            if (result.success) {
                respond result.data
            } else {
                respond status: 422, message: result.message
            }
        } catch (Exception e) {
            log.error "Erro ao atualizar grupos: ${e.message}", e
            respond status: 500, message: "Erro ao atualizar grupos: ${e.message}"
        }
    }
    /**
     * GET /api/usuarios
     * Lista usuários com paginação
     */
    @Override
    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)

        try {
            def result = usuarioService.list(params)
            respond result.data, [model: [totalCount: result.totalCount]]
        } catch (Exception e) {
            log.error "Erro ao listar usuários: ${e.message}", e
            respond status: 500, message: "Erro interno do servidor"
        }
    }

    /**
     * GET /api/usuarios/:id
     * Mostra um usuário específico
     */
    @Override
    def show() {
        try {
            Usuario usuario = usuarioService.getById(params.id)
            if (!usuario) {
                respond status: 404, message: "Usuário não encontrado"
                return
            }
            respond usuarioService.toMap(usuario)
        } catch (Exception e) {
            log.error "Erro ao buscar usuário: ${e.message}", e
            respond status: 500, message: "Erro interno do servidor"
        }
    }

    /**
     * POST /api/usuarios
     * Cria um novo usuário
     */
    @Override
    def save() {
        try {
            def data = request.JSON
            def result = usuarioService.save(data)

            if (result.success) {
                respond result.data, [status: 201]
            } else {
                respond status: 422, message: result.message
            }
        } catch (Exception e) {
            log.error "Erro ao criar usuário: ${e.message}", e
            respond status: 500, message: "Erro ao criar usuário: ${e.message}"
        }
    }

    /**
     * PUT /api/usuarios/:id
     * Atualiza um usuário
     */
    @Override
    def update() {
        try {
            def data = request.JSON
            data.id = params.id

            def result = usuarioService.save(data)

            if (result.success) {
                respond result.data
            } else {
                respond status: 422, message: result.message
            }
        } catch (Exception e) {
            log.error "Erro ao atualizar usuário: ${e.message}", e
            respond status: 500, message: "Erro ao atualizar usuário: ${e.message}"
        }
    }

    /**
     * DELETE /api/usuarios/:id
     * Deleta um usuário
     */
    @Override
    def delete() {
        try {
            def result = usuarioService.delete(params.id)
            if (result.success) {
                respond status: 204
            } else {
                respond status: 404, message: result.message
            }
        } catch (Exception e) {
            log.error "Erro ao deletar usuário: ${e.message}", e
            respond status: 500, message: "Erro ao deletar usuário: ${e.message}"
        }
    }

    /**
     * PUT /api/usuarios/:id/roles
     * Atualiza as roles de um usuário
     */
    def updateRoles() {
        try {
            def data = request.JSON
            def result = usuarioService.updateRoles(params.id as Long, data.roleIds)

            if (result.success) {
                respond result.data
            } else {
                respond status: 422, message: result.message
            }
        } catch (Exception e) {
            log.error "Erro ao atualizar roles: ${e.message}", e
            respond status: 500, message: "Erro ao atualizar roles: ${e.message}"
        }
    }

    /**
     * PUT /api/usuarios/:id/toggleStatus
     * Ativa/Desativa usuário
     */
    def toggleStatus() {
        try {
            def result = usuarioService.toggleStatus(params.id)
            if (result.success) {
                respond result.data
            } else {
                respond status: 404, message: result.message
            }
        } catch (Exception e) {
            log.error "Erro ao alterar status: ${e.message}", e
            respond status: 500, message: "Erro ao alterar status"
        }
    }
}