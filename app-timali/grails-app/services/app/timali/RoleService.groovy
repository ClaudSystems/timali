package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j

@Slf4j
@Transactional
class RoleService {

    /**
     * Lista todas as roles
     */
    List<Role> list(Map params) {
        Role.createCriteria().list(params) {
            if (params.search) {
                ilike('authority', "%${params.search}%")
            }
            order('authority', 'asc')
        }
    }

    /**
     * Conta total de roles
     */
    int count(Map params = [:]) {
        Role.createCriteria().count {
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
     * Salva uma nova role
     */
    Map save(Map data) {
        log.info "Criando role: ${data.authority}"

        if (!data.authority) {
            return [success: false, error: "Authority é obrigatória"]
        }

        def authority = data.authority.toUpperCase()
        if (!authority.startsWith('ROLE_')) {
            authority = 'ROLE_' + authority
        }

        if (Role.findByAuthority(authority)) {
            return [success: false, error: "Role '${authority}' já existe"]
        }

        try {
            Role role = new Role(authority: authority)
            role.save(flush: true, failOnError: true)

            log.info "Role criada: ${role.authority}"
            return [success: true, data: role]

        } catch (Exception e) {
            log.error "Erro ao criar role: ${e.message}", e
            return [success: false, error: "Erro ao criar role: ${e.message}"]
        }
    }

    /**
     * Atualiza uma role
     */
    Map update(Serializable id, Map data) {
        log.info "Atualizando role ID: ${id}"

        Role role = Role.get(id)
        if (!role) {
            return [success: false, error: "Role não encontrada"]
        }

        try {
            if (data.authority) {
                def authority = data.authority.toUpperCase()
                if (!authority.startsWith('ROLE_')) {
                    authority = 'ROLE_' + authority
                }

                def existing = Role.findByAuthority(authority)
                if (existing && existing.id != role.id) {
                    return [success: false, error: "Authority '${authority}' já existe"]
                }

                role.authority = authority
            }

            role.save(flush: true, failOnError: true)
            log.info "Role atualizada: ${role.authority}"
            return [success: true, data: role]

        } catch (Exception e) {
            log.error "Erro ao atualizar role: ${e.message}", e
            return [success: false, error: "Erro ao atualizar: ${e.message}"]
        }
    }

    /**
     * Deleta uma role
     */
    Map delete(Serializable id) {
        log.info "Deletando role ID: ${id}"

        Role role = Role.get(id)
        if (!role) {
            return [success: false, error: "Role não encontrada"]
        }

        try {
            // Remove associações
            UsuarioRole.removeAll(role)

            // Remove dos grupos
            RoleGroup.findAll().each { group ->
                if (group.roles.contains(role)) {
                    group.removeFromRoles(role)
                    group.save(flush: true)
                }
            }

            role.delete(flush: true)
            log.info "Role deletada: ${id}"
            return [success: true]

        } catch (Exception e) {
            log.error "Erro ao deletar role: ${e.message}", e
            return [success: false, error: "Erro ao deletar: ${e.message}"]
        }
    }

    /**
     * Cria roles padrão do sistema
     */
    Map createDefaultRoles() {
        log.info "Criando roles padrão..."

        def defaultRoles = [
                'ROLE_ADMIN',
                'ROLE_USER',
                'ROLE_GERENTE',
                'ROLE_GESTOR',
                'ROLE_CAIXA',
                'ROLE_ENTIDADE_CREATE', 'ROLE_ENTIDADE_READ', 'ROLE_ENTIDADE_UPDATE', 'ROLE_ENTIDADE_DELETE',
                'ROLE_CREDITO_CREATE', 'ROLE_CREDITO_READ', 'ROLE_CREDITO_UPDATE', 'ROLE_CREDITO_DELETE',
                'ROLE_CREDITO_RECALCULAR', 'ROLE_CREDITO_INVALIDAR', 'ROLE_CREDITO_ARQUIVAR',
                'ROLE_PAGAMENTO_CREATE', 'ROLE_PAGAMENTO_READ', 'ROLE_PAGAMENTO_DELETE', 'ROLE_PAGAMENTO_RECIBO',
                'ROLE_DEFINICAO_CREATE', 'ROLE_DEFINICAO_READ', 'ROLE_DEFINICAO_UPDATE', 'ROLE_DEFINICAO_DELETE',
                'ROLE_SAIDA_CAIXA_CREATE', 'ROLE_SAIDA_CAIXA_READ', 'ROLE_SAIDA_CAIXA_UPDATE', 'ROLE_SAIDA_CAIXA_DELETE',
                'ROLE_DIARIO_READ', 'ROLE_DIARIO_GERAR', 'ROLE_DIARIO_FECHAR', 'ROLE_DIARIO_REABRIR',
                'ROLE_SETTINGS_READ', 'ROLE_SETTINGS_UPDATE',
                'ROLE_USUARIO_CREATE', 'ROLE_USUARIO_READ', 'ROLE_USUARIO_UPDATE', 'ROLE_USUARIO_DELETE',
                'ROLE_GROUP_CREATE', 'ROLE_GROUP_READ', 'ROLE_GROUP_UPDATE', 'ROLE_GROUP_DELETE'
        ]

        int created = 0
        defaultRoles.each { authority ->
            if (!Role.findByAuthority(authority)) {
                new Role(authority: authority).save(flush: true)
                created++
            }
        }

        log.info "Roles padrão criadas: ${created}"
        return [success: true, message: "${created} roles criadas"]
    }
}