package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j
import grails.validation.ValidationException

@Slf4j
@Transactional
class RoleService {

    /**
     * Lista todas as roles com paginação e busca
     */
    List<Role> list(Map params) {
        def criteria = Role.createCriteria()

        def results = criteria.list(max: params.max ?: 10, offset: params.offset ?: 0) {
            if (params.search) {
                ilike('authority', "%${params.search}%")
            }
            order(params.sort ?: 'authority', params.order ?: 'asc')
        }

        return results
    }

    /**
     * Conta total de roles para paginação
     */
    int count(Map params = [:]) {
        def criteria = Role.createCriteria()

        criteria.count {
            if (params.search) {
                ilike('authority', "%${params.search}%")
            }
        }
    }

    /**
     * Busca role por ID
     */
    Role getById(Serializable id) {
        Role.get(id)
    }

    /**
     * Busca role por authority
     */
    Role findByAuthority(String authority) {
        Role.findByAuthority(authority)
    }

    /**
     * Salva ou atualiza uma role
     */
    Role save(Role role) {
        if (!role) return null

        try {
            role.save(flush: true, failOnError: true)
            log.info "Role '${role.authority}' salva com sucesso"
            return role
        } catch (ValidationException e) {
            log.error "Erro de validação ao salvar role: ${e.message}", e
            throw e
        } catch (Exception e) {
            log.error "Erro ao salvar role: ${e.message}", e
            throw new RuntimeException("Falha ao salvar role: ${e.message}")
        }
    }

    /**
     * Deleta uma role
     */
    void delete(Serializable id) {
        Role role = getById(id)
        if (!role) {
            throw new RuntimeException("Role não encontrada com ID: ${id}")
        }

        try {
            // Remove todas as associações primeiro
            UsuarioRole.removeAll(role)
            role.delete(flush: true)
            log.info "Role '${role.authority}' deletada com sucesso"
        } catch (Exception e) {
            log.error "Erro ao deletar role: ${e.message}", e
            throw new RuntimeException("Falha ao deletar role: ${e.message}")
        }
    }

    /**
     * Cria roles padrão do sistema
     */
    List<Role> createDefaultRoles() {
        def defaultRoles = [
                'ROLE_ADMIN',
                'ROLE_GERENTE',
                'ROLE_GESTOR',
                'ROLE_CAIXA'
        ]

        List<Role> roles = []
        defaultRoles.each { authority ->
            if (!Role.findByAuthority(authority)) {
                Role role = new Role(authority: authority)
                save(role)
                roles << role
            }
        }

        return roles
    }
}