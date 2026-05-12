package app.timali

import grails.gorm.transactions.Transactional
import groovy.util.logging.Slf4j

@Slf4j
@Transactional
class UsuarioService {

    /**
     * Lista usuários com paginação
     */
    List<Map> list(Map params) {
        def usuarios = Usuario.createCriteria().list(params) {
            if (params.search) {
                ilike('username', "%${params.search}%")
            }
            order('username', 'asc')
        }

        return usuarios.collect { buildUsuarioMap(it) }
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
     * Cria um novo usuário
     */
    Map save(Map data) {
        log.info "Criando usuário: ${data.username}"

        // Validar username
        if (!data.username) {
            return [success: false, error: "Username é obrigatório"]
        }

        // Verificar duplicidade
        if (Usuario.findByUsername(data.username)) {
            return [success: false, error: "Usuário '${data.username}' já existe"]
        }

        try {
            Usuario usuario = new Usuario()
            usuario.username = data.username
            usuario.password = data.password ? '{noop}' + data.password : '{noop}temp123'
            usuario.enabled = data.enabled != null ? data.enabled : true
            usuario.accountExpired = data.accountExpired ?: false
            usuario.accountLocked = data.accountLocked ?: false
            usuario.passwordExpired = data.passwordExpired ?: false

            usuario.save(flush: true, failOnError: true)

            // Adicionar ROLE_USER básica
            Role userRole = Role.findByAuthority('ROLE_USER')
            if (userRole && !UsuarioRole.exists(usuario.id, userRole.id)) {
                UsuarioRole.create(usuario, userRole, true)
            }

            log.info "Usuário criado: ${usuario.username} (ID: ${usuario.id})"
            return [success: true, data: buildUsuarioMap(usuario)]

        } catch (Exception e) {
            log.error "Erro ao criar usuário: ${e.message}", e
            return [success: false, error: "Erro ao criar usuário: ${e.message}"]
        }
    }

    /**
     * Atualiza um usuário existente
     */
    Map update(Serializable id, Map data) {
        log.info "Atualizando usuário ID: ${id}"

        Usuario usuario = Usuario.get(id)
        if (!usuario) {
            return [success: false, error: "Usuário não encontrado"]
        }

        try {
            if (data.username) usuario.username = data.username
            if (data.password) usuario.password = '{noop}' + data.password
            if (data.enabled != null) usuario.enabled = data.enabled
            if (data.accountExpired != null) usuario.accountExpired = data.accountExpired
            if (data.accountLocked != null) usuario.accountLocked = data.accountLocked
            if (data.passwordExpired != null) usuario.passwordExpired = data.passwordExpired

            usuario.save(flush: true, failOnError: true)

            log.info "Usuário atualizado: ${usuario.username}"
            return [success: true, data: buildUsuarioMap(usuario)]

        } catch (Exception e) {
            log.error "Erro ao atualizar usuário: ${e.message}", e
            return [success: false, error: "Erro ao atualizar: ${e.message}"]
        }
    }

    /**
     * Deleta um usuário
     */
    Map delete(Serializable id) {
        log.info "Deletando usuário ID: ${id}"

        Usuario usuario = Usuario.get(id)
        if (!usuario) {
            return [success: false, error: "Usuário não encontrado"]
        }

        try {
            // Remove associações
            UsuarioRole.removeAll(usuario)
            UsuarioRoleGroup.removeAll(usuario)

            usuario.delete(flush: true)

            log.info "Usuário deletado: ${id}"
            return [success: true]

        } catch (Exception e) {
            log.error "Erro ao deletar usuário: ${e.message}", e
            return [success: false, error: "Erro ao deletar: ${e.message}"]
        }
    }

    /**
     * Atualiza roles de um usuário
     */
    Map updateRoles(Serializable userId, List<Long> roleIds) {
        log.info "Atualizando roles do usuário ID: ${userId}"

        Usuario usuario = Usuario.get(userId)
        if (!usuario) {
            return [success: false, error: "Usuário não encontrado"]
        }

        try {
            // Remove roles atuais
            UsuarioRole.removeAll(usuario)

            // Adiciona novas roles
            roleIds?.each { roleId ->
                Role role = Role.get(roleId)
                if (role) {
                    UsuarioRole.create(usuario, role, true)
                }
            }

            log.info "Roles atualizadas para: ${usuario.username}"
            return [success: true, data: buildUsuarioMap(usuario)]

        } catch (Exception e) {
            log.error "Erro ao atualizar roles: ${e.message}", e
            return [success: false, error: "Erro ao atualizar roles: ${e.message}"]
        }
    }

    /**
     * Atualiza grupos de um usuário
     */
    Map updateGroups(Serializable userId, List<Long> groupIds) {
        log.info "Atualizando grupos do usuário ID: ${userId}"

        Usuario usuario = Usuario.get(userId)
        if (!usuario) {
            return [success: false, error: "Usuário não encontrado"]
        }

        try {
            // Remove grupos atuais
            UsuarioRoleGroup.removeAll(usuario)

            // Adiciona novos grupos
            groupIds?.each { groupId ->
                RoleGroup group = RoleGroup.get(groupId)
                if (group) {
                    UsuarioRoleGroup.create(usuario, group, true)

                    // Também adiciona as roles do grupo
                    group.roles?.each { role ->
                        if (!UsuarioRole.exists(usuario.id, role.id)) {
                            UsuarioRole.create(usuario, role, true)
                        }
                    }
                }
            }

            log.info "Grupos atualizados para: ${usuario.username}"
            return [success: true, data: buildUsuarioMap(usuario)]

        } catch (Exception e) {
            log.error "Erro ao atualizar grupos: ${e.message}", e
            return [success: false, error: "Erro ao atualizar grupos: ${e.message}"]
        }
    }

    /**
     * Ativa/Desativa usuário
     */
    Map toggleStatus(Serializable id) {
        log.info "Alternando status do usuário ID: ${id}"

        Usuario usuario = Usuario.get(id)
        if (!usuario) {
            return [success: false, error: "Usuário não encontrado"]
        }

        try {
            usuario.enabled = !usuario.enabled
            usuario.save(flush: true, failOnError: true)

            String status = usuario.enabled ? "ativado" : "desativado"
            log.info "Usuário ${usuario.username} ${status}"
            return [success: true, data: buildUsuarioMap(usuario), message: "Usuário ${status}"]

        } catch (Exception e) {
            log.error "Erro ao alterar status: ${e.message}", e
            return [success: false, error: "Erro ao alterar status: ${e.message}"]
        }
    }

    /**
     * Constrói o Map de resposta do usuário
     */
    Map buildUsuarioMap(Usuario usuario) {
        [
                id: usuario.id,
                username: usuario.username,
                enabled: usuario.enabled,
                accountExpired: usuario.accountExpired,
                accountLocked: usuario.accountLocked,
                passwordExpired: usuario.passwordExpired,
                roles: usuario.authorities?.collect { role ->
                    [id: role.id, authority: role.authority]
                } ?: [],
                groups: UsuarioRoleGroup.findAllByUsuario(usuario)?.collect { urg ->
                    [
                            id: urg.roleGroup.id,
                            name: urg.roleGroup.name,
                            description: urg.roleGroup.description,
                            roles: urg.roleGroup.roles?.collect { role ->
                                [id: role.id, authority: role.authority]
                            } ?: []
                    ]
                } ?: []
        ]
    }
}