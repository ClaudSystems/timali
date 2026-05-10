package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j
import grails.validation.ValidationException

@Slf4j
@Transactional
class UsuarioService {

    def springSecurityService

    Map updateGroups(Long userId, List<Long> groupIds) {
        Usuario usuario = getById(userId)
        if (!usuario) {
            return [success: false, message: "Usuário não encontrado"]
        }

        try {
            // Remove todos os grupos atuais
            UsuarioRoleGroup.removeAll(usuario)

            // Remove também roles individuais para evitar conflitos
            UsuarioRole.removeAll(usuario)

            // Adiciona os novos grupos
            groupIds?.each { groupId ->
                RoleGroup group = RoleGroup.get(groupId)
                if (group) {
                    UsuarioRoleGroup.create(usuario, group, true)

                    // Opcional: Adiciona também as roles individuais do grupo
                    group.roles?.each { role ->
                        UsuarioRole.create(usuario, role, true)
                    }
                }
            }

            log.info "Grupos atualizados para usuário '${usuario.username}'"

            [
                    success: true,
                    message: "Grupos atualizados com sucesso",
                    data: toMap(usuario)
            ]
        } catch (Exception e) {
            log.error "Erro ao atualizar grupos: ${e.message}", e
            [success: false, message: "Falha ao atualizar grupos: ${e.message}"]
        }
    }

    /**
     * Lista usuários com paginação e busca
     */
    Map list(Map params) {
        def criteria = Usuario.createCriteria()

        int total = criteria.count {
            if (params.search) {
                or {
                    ilike('username', "%${params.search}%")
                }
            }
            if (params.enabled != null) {
                eq('enabled', params.enabled.toBoolean())
            }
        }

        def results = criteria.list(max: params.max ?: 10, offset: params.offset ?: 0) {
            if (params.search) {
                ilike('username', "%${params.search}%")
            }
            if (params.enabled != null) {
                eq('enabled', params.enabled.toBoolean())
            }
            order(params.sort ?: 'username', params.order ?: 'asc')
        }

        [
                data: results.collect { user -> toMap(user) },
                totalCount: total
        ]
    }

    /**
     * Busca usuário por ID
     */
    Usuario getById(Serializable id) {
        Usuario.get(id)
    }

    /**
     * Busca usuário por username
     */
    Usuario findByUsername(String username) {
        Usuario.findByUsername(username)
    }

    /**
     * Salva ou atualiza um usuário
     */
    Map save(Map data) {
        Usuario usuario

        if (data.id) {
            usuario = getById(data.id as Long)
            if (!usuario) {
                return [success: false, message: "Usuário não encontrado"]
            }

            // Só atualiza senha se foi fornecida
            if (data.password) {
                usuario.password = data.password
            }
        } else {
            usuario = new Usuario()
            usuario.password = data.password ?: 'temp123' // Senha temporária
        }

        usuario.username = data.username
        usuario.enabled = data.enabled != null ? data.enabled : true
        usuario.accountExpired = data.accountExpired ?: false
        usuario.accountLocked = data.accountLocked ?: false
        usuario.passwordExpired = data.passwordExpired ?: false

        try {
            usuario.validate()
            if (usuario.hasErrors()) {
                return [success: false, message: formatErrors(usuario.errors)]
            }

            usuario.save(flush: true, failOnError: true)
            log.info "Usuário '${usuario.username}' salvo com sucesso"

            [success: true, message: "Usuário salvo com sucesso", data: toMap(usuario)]
        } catch (ValidationException e) {
            log.error "Erro de validação: ${e.message}"
            [success: false, message: formatErrors(usuario.errors)]
        } catch (Exception e) {
            log.error "Erro ao salvar usuário: ${e.message}", e
            [success: false, message: "Falha ao salvar usuário: ${e.message}"]
        }
    }

    /**
     * Deleta um usuário
     */
    Map delete(Serializable id) {
        Usuario usuario = getById(id)
        if (!usuario) {
            return [success: false, message: "Usuário não encontrado"]
        }

        try {
            UsuarioRole.removeAll(usuario)
            usuario.delete(flush: true)
            log.info "Usuário '${usuario.username}' deletado com sucesso"
            [success: true, message: "Usuário deletado com sucesso"]
        } catch (Exception e) {
            log.error "Erro ao deletar usuário: ${e.message}", e
            [success: false, message: "Falha ao deletar usuário: ${e.message}"]
        }
    }

    /**
     * Atualiza as roles de um usuário
     */
    Map updateRoles(Long userId, List<Long> roleIds) {
        Usuario usuario = getById(userId)
        if (!usuario) {
            return [success: false, message: "Usuário não encontrado"]
        }

        try {
            // Remove todas as roles atuais
            UsuarioRole.removeAll(usuario)

            // Adiciona as novas roles
            roleIds?.each { roleId ->
                Role role = Role.get(roleId)
                if (role) {
                    UsuarioRole.create(usuario, role, true)
                }
            }

            log.info "Roles atualizadas para usuário '${usuario.username}'"
            [success: true, message: "Roles atualizadas com sucesso", data: toMap(usuario)]
        } catch (Exception e) {
            log.error "Erro ao atualizar roles: ${e.message}", e
            [success: false, message: "Falha ao atualizar roles: ${e.message}"]
        }
    }

    /**
     * Atualiza status do usuário (ativar/desativar)
     */
    Map toggleStatus(Long id) {
        Usuario usuario = getById(id)
        if (!usuario) {
            return [success: false, message: "Usuário não encontrado"]
        }

        usuario.enabled = !usuario.enabled
        usuario.save(flush: true, failOnError: true)

        def status = usuario.enabled ? 'ativado' : 'desativado'
        [success: true, message: "Usuário ${status} com sucesso", data: toMap(usuario)]
    }

    /**
     * Converte Usuario para Map
     */
    Map toMap(Usuario usuario) {
        if (!usuario) return [:]

        [
                id: usuario.id,
                username: usuario.username,
                enabled: usuario.enabled,
                accountExpired: usuario.accountExpired,
                accountLocked: usuario.accountLocked,
                passwordExpired: usuario.passwordExpired,
                roles: usuario.authorities?.collect { role ->
                    [
                            id: role.id,
                            authority: role.authority,
                            description: formatRoleDescription(role.authority)
                    ]
                },
                groups: UsuarioRoleGroup.findAllByUsuario(usuario)?.collect { urg ->
                    [
                            id: urg.roleGroup.id,
                            name: urg.roleGroup.name,
                            description: urg.roleGroup.description,
                            roles: urg.roleGroup.roles?.collect { role ->
                                [
                                        id: role.id,
                                        authority: role.authority
                                ]
                            }
                    ]
                } ?: []
        ]
    }



    /**
     * Formata a descrição da role
     */
    private String formatRoleDescription(String authority) {
        switch(authority) {
            case 'ROLE_ADMIN': return 'Administrador'
            case 'ROLE_GERENTE': return 'Gerente'
            case 'ROLE_GESTOR': return 'Gestor'
            case 'ROLE_CAIXA': return 'Caixa'
            default: return authority
        }
    }

    /**
     * Formata erros de validação
     */
    private String formatErrors(errors) {
        errors.allErrors.collect { it.defaultMessage }.join(', ')
    }
}