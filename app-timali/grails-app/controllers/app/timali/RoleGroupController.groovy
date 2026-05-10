// grails-app/controllers/app/timali/api/RoleGroupController.groovy
package app.timali.api

import app.timali.RoleGroup
import app.timali.RoleGroupService
import grails.rest.RestfulController
import groovy.util.logging.Slf4j

@Slf4j
class RoleGroupController extends RestfulController<RoleGroup> {

    static responseFormats = ['json']

    RoleGroupService roleGroupService

    RoleGroupController() {
        super(RoleGroup)
    }

    /**
     * GET /api/roleGroups
     * Lista todos os grupos
     */
    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)

        try {
            def groups = roleGroupService.list(params)
            def totalCount = roleGroupService.count(params)

            respond groups.collect { roleGroupService.toMap(it) },
                    [model: [totalCount: totalCount]]
        } catch (Exception e) {
            log.error "Erro ao listar grupos: ${e.message}", e
            respond status: 500, message: "Erro interno do servidor"
        }
    }

    /**
     * GET /api/roleGroups/:id
     * Mostra um grupo específico
     */
    def show() {
        try {
            RoleGroup group = roleGroupService.getById(params.id)
            if (!group) {
                respond status: 404, message: "Grupo não encontrado"
                return
            }
            respond roleGroupService.toMap(group)
        } catch (Exception e) {
            log.error "Erro ao buscar grupo: ${e.message}", e
            respond status: 500, message: "Erro interno do servidor"
        }
    }

    /**
     * POST /api/roleGroups
     * Cria um novo grupo
     */
    def save() {
        try {
            def data = request.JSON

            if (!data.name) {
                respond status: 422, message: "Campo 'name' é obrigatório"
                return
            }

            if (roleGroupService.findByName(data.name)) {
                respond status: 422, message: "Grupo '${data.name}' já existe"
                return
            }

            RoleGroup group = roleGroupService.save(data)
            respond roleGroupService.toMap(group), [status: 201]
        } catch (Exception e) {
            log.error "Erro ao criar grupo: ${e.message}", e
            respond status: 500, message: "Erro ao criar grupo: ${e.message}"
        }
    }

    /**
     * PUT /api/roleGroups/:id
     * Atualiza um grupo
     */
    def update() {
        try {
            RoleGroup group = roleGroupService.getById(params.id)
            if (!group) {
                respond status: 404, message: "Grupo não encontrado"
                return
            }

            def data = request.JSON
            data.id = params.id

            group = roleGroupService.save(data)
            respond roleGroupService.toMap(group)
        } catch (Exception e) {
            log.error "Erro ao atualizar grupo: ${e.message}", e
            respond status: 500, message: "Erro ao atualizar grupo: ${e.message}"
        }
    }

    /**
     * DELETE /api/roleGroups/:id
     * Deleta um grupo
     */
    def delete() {
        try {
            roleGroupService.delete(params.id)
            respond status: 204
        } catch (Exception e) {
            log.error "Erro ao deletar grupo: ${e.message}", e
            respond status: 500, message: "Erro ao deletar grupo: ${e.message}"
        }
    }

    /**
     * POST /api/roleGroups/initDefaults
     * Inicializa grupos padrão
     */
    def initDefaults() {
        try {
            def groups = roleGroupService.createDefaultGroups()
            respond message: "Grupos padrão criados com sucesso",
                    data: groups.collect { roleGroupService.toMap(it) }
        } catch (Exception e) {
            log.error "Erro ao criar grupos padrão: ${e.message}", e
            respond status: 500, message: "Erro ao criar grupos padrão"
        }
    }
}