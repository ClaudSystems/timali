package app.timali.api

import app.timali.Role
import app.timali.RoleService
import grails.rest.RestfulController
import groovy.util.logging.Slf4j

@Slf4j
class RoleController extends RestfulController<Role> {

    static responseFormats = ['json']

    RoleService roleService

    RoleController() {
        super(Role)
    }

    /**
     * GET /api/roles
     * Lista todas as roles
     */
    @Override
    def index(Integer max) {
        params.max = Math.min(max ?: 10, 100)

        try {
            def roles = roleService.list(params)
            def totalCount = roleService.count(params)

            respond roles, [model: [
                    totalCount: totalCount,
                    items: roles
            ]]
        } catch (Exception e) {
            log.error "Erro ao listar roles: ${e.message}", e
            respond status: 500, message: "Erro interno do servidor"
        }
    }

    /**
     * GET /api/roles/:id
     * Mostra uma role específica
     */
    @Override
    def show() {
        try {
            Role role = roleService.getById(params.id)
            if (!role) {
                respond status: 404, message: "Role não encontrada"
                return
            }
            respond role
        } catch (Exception e) {
            log.error "Erro ao buscar role: ${e.message}", e
            respond status: 500, message: "Erro interno do servidor"
        }
    }

    /**
     * POST /api/roles
     * Cria uma nova role
     */
    @Override
    def save() {
        try {
            def data = request.JSON

            // Validação dos dados
            if (!data.authority) {
                respond status: 422, message: "Campo 'authority' é obrigatório"
                return
            }

            // Verifica se já existe
            if (roleService.findByAuthority(data.authority)) {
                respond status: 422, message: "Role '${data.authority}' já existe"
                return
            }

            Role role = new Role(authority: data.authority.toUpperCase())
            roleService.save(role)

            respond role, [status: 201]
        } catch (Exception e) {
            log.error "Erro ao criar role: ${e.message}", e
            respond status: 500, message: "Erro ao criar role: ${e.message}"
        }
    }

    /**
     * PUT /api/roles/:id
     * Atualiza uma role
     */
    @Override
    def update() {
        try {
            Role role = roleService.getById(params.id)
            if (!role) {
                respond status: 404, message: "Role não encontrada"
                return
            }

            def data = request.JSON
            if (data.authority) {
                // Verifica se o novo authority já existe em outra role
                def existingRole = roleService.findByAuthority(data.authority)
                if (existingRole && existingRole.id != role.id) {
                    respond status: 422, message: "Já existe uma role com authority '${data.authority}'"
                    return
                }
                role.authority = data.authority.toUpperCase()
            }

            roleService.save(role)
            respond role
        } catch (Exception e) {
            log.error "Erro ao atualizar role: ${e.message}", e
            respond status: 500, message: "Erro ao atualizar role: ${e.message}"
        }
    }

    /**
     * DELETE /api/roles/:id
     * Deleta uma role
     */
    @Override
    def delete() {
        try {
            Role role = roleService.getById(params.id)
            if (!role) {
                respond status: 404, message: "Role não encontrada"
                return
            }

            roleService.delete(params.id)
            respond status: 204
        } catch (Exception e) {
            log.error "Erro ao deletar role: ${e.message}", e
            respond status: 500, message: "Erro ao deletar role: ${e.message}"
        }
    }

    /**
     * POST /api/roles/initDefaults
     * Inicializa roles padrão do sistema
     */
    def initDefaults() {
        try {
            def roles = roleService.createDefaultRoles()
            respond message: "Roles padrão criadas com sucesso", data: roles
        } catch (Exception e) {
            log.error "Erro ao criar roles padrão: ${e.message}", e
            respond status: 500, message: "Erro ao criar roles padrão"
        }
    }
}