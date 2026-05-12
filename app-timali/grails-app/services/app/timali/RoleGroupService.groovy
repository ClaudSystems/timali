package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j

@Slf4j
@Transactional
class RoleGroupService {

    /**
     * Lista todos os grupos
     */
    List<RoleGroup> list(Map params) {
        RoleGroup.createCriteria().list(params) {
            if (params.search) {
                or {
                    ilike('name', "%${params.search}%")
                    ilike('description', "%${params.search}%")
                }
            }
            order('name', 'asc')
        }
    }

    /**
     * Conta total de grupos
     */
    int count(Map params = [:]) {
        RoleGroup.createCriteria().count {
            if (params.search) {
                or {
                    ilike('name', "%${params.search}%")
                    ilike('description', "%${params.search}%")
                }
            }
        }
    }

    /**
     * Busca grupo por ID
     */
    RoleGroup getById(Serializable id) {
        RoleGroup.get(id)
    }

    /**
     * Busca grupo por nome
     */
    RoleGroup findByName(String name) {
        RoleGroup.findByName(name)
    }

    /**
     * Salva um novo grupo
     */
    Map save(Map data) {
        log.info "Criando grupo: ${data.name}"

        if (!data.name) {
            return [success: false, error: "Nome é obrigatório"]
        }

        if (RoleGroup.findByName(data.name)) {
            return [success: false, error: "Grupo '${data.name}' já existe"]
        }

        try {
            RoleGroup group = new RoleGroup(
                    name: data.name,
                    description: data.description
            )

            // Adiciona roles se fornecidas
            if (data.roleIds) {
                data.roleIds.each { roleId ->
                    Role role = Role.get(roleId)
                    if (role) {
                        group.addToRoles(role)
                    }
                }
            }

            group.save(flush: true, failOnError: true)
            log.info "Grupo criado: ${group.name}"
            return [success: true, data: group]

        } catch (Exception e) {
            log.error "Erro ao criar grupo: ${e.message}", e
            return [success: false, error: "Erro ao criar grupo: ${e.message}"]
        }
    }

    /**
     * Atualiza um grupo
     */
    Map update(Serializable id, Map data) {
        log.info "Atualizando grupo ID: ${id}"

        RoleGroup group = RoleGroup.get(id)
        if (!group) {
            return [success: false, error: "Grupo não encontrado"]
        }

        try {
            if (data.name) group.name = data.name
            if (data.description != null) group.description = data.description

            // Atualiza roles
            if (data.roleIds) {
                group.roles.clear()
                data.roleIds.each { roleId ->
                    Role role = Role.get(roleId)
                    if (role) {
                        group.addToRoles(role)
                    }
                }
            }

            group.save(flush: true, failOnError: true)
            log.info "Grupo atualizado: ${group.name}"
            return [success: true, data: group]

        } catch (Exception e) {
            log.error "Erro ao atualizar grupo: ${e.message}", e
            return [success: false, error: "Erro ao atualizar: ${e.message}"]
        }
    }

    /**
     * Deleta um grupo
     */
    Map delete(Serializable id) {
        log.info "Deletando grupo ID: ${id}"

        RoleGroup group = RoleGroup.get(id)
        if (!group) {
            return [success: false, error: "Grupo não encontrado"]
        }

        try {
            // Remove associações com usuários
            UsuarioRoleGroup.removeAll(group)

            group.delete(flush: true)
            log.info "Grupo deletado: ${id}"
            return [success: true]

        } catch (Exception e) {
            log.error "Erro ao deletar grupo: ${e.message}", e
            return [success: false, error: "Erro ao deletar: ${e.message}"]
        }
    }

    /**
     * Cria grupos padrão do sistema
     */
    Map createDefaultGroups() {
        log.info "Criando grupos padrão..."

        def defaultGroups = [
                [
                        name: 'ADMIN',
                        description: 'Administrador do sistema - Acesso total',
                        roleNames: [
                                'ROLE_ADMIN', 'ROLE_USER', 'ROLE_GERENTE', 'ROLE_GESTOR', 'ROLE_CAIXA',
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
                ],
                [
                        name: 'GERENTE',
                        description: 'Gerente - Gestão de créditos e relatórios',
                        roleNames: [
                                'ROLE_USER', 'ROLE_GERENTE',
                                'ROLE_ENTIDADE_CREATE', 'ROLE_ENTIDADE_READ', 'ROLE_ENTIDADE_UPDATE',
                                'ROLE_CREDITO_CREATE', 'ROLE_CREDITO_READ', 'ROLE_CREDITO_UPDATE',
                                'ROLE_CREDITO_RECALCULAR', 'ROLE_CREDITO_INVALIDAR', 'ROLE_CREDITO_ARQUIVAR',
                                'ROLE_PAGAMENTO_READ', 'ROLE_PAGAMENTO_RECIBO',
                                'ROLE_DEFINICAO_CREATE', 'ROLE_DEFINICAO_READ', 'ROLE_DEFINICAO_UPDATE',
                                'ROLE_SAIDA_CAIXA_READ',
                                'ROLE_DIARIO_READ', 'ROLE_DIARIO_GERAR',
                                'ROLE_SETTINGS_READ'
                        ]
                ],
                [
                        name: 'GESTOR',
                        description: 'Gestor - Supervisão e aprovação',
                        roleNames: [
                                'ROLE_USER', 'ROLE_GESTOR',
                                'ROLE_ENTIDADE_READ',
                                'ROLE_CREDITO_READ', 'ROLE_CREDITO_UPDATE', 'ROLE_CREDITO_INVALIDAR',
                                'ROLE_PAGAMENTO_CREATE', 'ROLE_PAGAMENTO_READ', 'ROLE_PAGAMENTO_RECIBO',
                                'ROLE_DEFINICAO_READ',
                                'ROLE_SAIDA_CAIXA_CREATE', 'ROLE_SAIDA_CAIXA_READ', 'ROLE_SAIDA_CAIXA_UPDATE',
                                'ROLE_DIARIO_READ', 'ROLE_DIARIO_GERAR', 'ROLE_DIARIO_FECHAR',
                                'ROLE_SETTINGS_READ'
                        ]
                ],
                [
                        name: 'CAIXA',
                        description: 'Caixa - Operações de pagamento',
                        roleNames: [
                                'ROLE_USER', 'ROLE_CAIXA',
                                'ROLE_ENTIDADE_READ',
                                'ROLE_CREDITO_READ',
                                'ROLE_PAGAMENTO_CREATE', 'ROLE_PAGAMENTO_READ', 'ROLE_PAGAMENTO_RECIBO',
                                'ROLE_SAIDA_CAIXA_CREATE', 'ROLE_SAIDA_CAIXA_READ',
                                'ROLE_DIARIO_READ', 'ROLE_DIARIO_GERAR',
                                'ROLE_SETTINGS_READ'
                        ]
                ]
        ]

        int created = 0
        defaultGroups.each { groupData ->
            if (!RoleGroup.findByName(groupData.name)) {
                RoleGroup group = new RoleGroup(
                        name: groupData.name,
                        description: groupData.description
                )

                groupData.roleNames.each { roleName ->
                    Role role = Role.findByAuthority(roleName)
                    if (role) {
                        group.addToRoles(role)
                    }
                }

                group.save(flush: true, failOnError: true)
                created++
            }
        }

        log.info "Grupos padrão criados: ${created}"
        return [success: true, message: "${created} grupos criados"]
    }

    /**
     * Converte grupo para Map
     */
    Map toMap(RoleGroup group) {
        if (!group) return [:]

        [
                id: group.id,
                name: group.name,
                description: group.description,
                roles: group.roles?.collect { [id: it.id, authority: it.authority] } ?: [],
                totalRoles: group.roles?.size() ?: 0
        ]
    }
}