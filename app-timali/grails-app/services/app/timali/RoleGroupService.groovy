// grails-app/services/app/timali/RoleGroupService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j
import grails.validation.ValidationException

@Slf4j
@Transactional
class RoleGroupService {

    /**
     * Lista todos os grupos de roles
     */
    List<RoleGroup> list(Map params) {
        def criteria = RoleGroup.createCriteria()

        criteria.list(max: params.max ?: 10, offset: params.offset ?: 0) {
            if (params.search) {
                or {
                    ilike('name', "%${params.search}%")
                    ilike('description', "%${params.search}%")
                }
            }
            order(params.sort ?: 'name', params.order ?: 'asc')
        }
    }

    /**
     * Conta total de grupos para paginação
     */
    int count(Map params = [:]) {
        def criteria = RoleGroup.createCriteria()

        criteria.count {
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
     * Salva ou atualiza um grupo de roles
     */
    RoleGroup save(Map data) {
        RoleGroup group

        if (data.id) {
            group = getById(data.id as Long)
            if (!group) {
                throw new RuntimeException("Grupo não encontrado")
            }
        } else {
            group = new RoleGroup()
        }

        group.name = data.name
        group.description = data.description

        // Atualiza as roles do grupo
        if (data.roleIds) {
            group.roles = Role.findAllByIdInList(data.roleIds as List<Long>)
        }

        try {
            group.save(flush: true, failOnError: true)
            log.info "Grupo '${group.name}' salvo com sucesso"
            return group
        } catch (ValidationException e) {
            log.error "Erro de validação ao salvar grupo: ${e.message}", e
            throw e
        } catch (Exception e) {
            log.error "Erro ao salvar grupo: ${e.message}", e
            throw new RuntimeException("Falha ao salvar grupo: ${e.message}")
        }
    }

    /**
     * Deleta um grupo
     */
    void delete(Serializable id) {
        RoleGroup group = getById(id)
        if (!group) {
            throw new RuntimeException("Grupo não encontrado")
        }

        try {
            // Remove associações com usuários que usam este grupo
            UsuarioRoleGroup.findAllByRoleGroup(group).each { ur ->
                ur.delete(flush: true)
            }

            group.delete(flush: true)
            log.info "Grupo '${group.name}' deletado com sucesso"
        } catch (Exception e) {
            log.error "Erro ao deletar grupo: ${e.message}", e
            throw new RuntimeException("Falha ao deletar grupo: ${e.message}")
        }
    }

    /**
     * Cria grupos padrão do sistema
     */
    List<RoleGroup> createDefaultGroups() {
        def defaultGroups = [
                [
                        name: 'ADMIN',
                        description: 'Administrador do sistema - acesso total',
                        roleNames: ['ROLE_ADMIN']
                ],
                [
                        name: 'GERENTE',
                        description: 'Gerente - gestão de créditos e relatórios',
                        roleNames: ['ROLE_GERENTE']
                ],
                [
                        name: 'GESTOR',
                        description: 'Gestor - aprovação e supervisão',
                        roleNames: ['ROLE_GESTOR']
                ],
                [
                        name: 'CAIXA',
                        description: 'Caixa - operações de pagamento',
                        roleNames: ['ROLE_CAIXA']
                ],
                [
                        name: 'SUPER_USUARIO',
                        description: 'Super usuário - acesso a múltiplas funções',
                        roleNames: ['ROLE_ADMIN', 'ROLE_GERENTE', 'ROLE_GESTOR', 'ROLE_CAIXA']
                ],
                [
                        name: 'GERENTE_CAIXA',
                        description: 'Gerente com acesso ao caixa',
                        roleNames: ['ROLE_GERENTE', 'ROLE_CAIXA']
                ],
                [
                        name: 'GESTOR_CAIXA',
                        description: 'Gestor com acesso ao caixa',
                        roleNames: ['ROLE_GESTOR', 'ROLE_CAIXA']
                ]
        ]

        List<RoleGroup> groups = []
        defaultGroups.each { groupData ->
            if (!RoleGroup.findByName(groupData.name)) {
                RoleGroup group = new RoleGroup(
                        name: groupData.name,
                        description: groupData.description
                )

                // Adiciona as roles ao grupo
                groupData.roleNames.each { roleName ->
                    def role = Role.findByAuthority(roleName)
                    if (role) {
                        group.addToRoles(role)
                    }
                }

                group.save(flush: true, failOnError: true)
                groups << group
            }
        }

        return groups
    }

    /**
     * Converte para Map para resposta JSON
     */
    Map toMap(RoleGroup group) {
        if (!group) return [:]

        [
                id: group.id,
                name: group.name,
                description: group.description,
                roles: group.roles?.collect { role ->
                    [
                            id: role.id,
                            authority: role.authority
                    ]
                } ?: [],
                totalRoles: group.roles?.size() ?: 0
        ]
    }
}