package app.timali

import app.timali.Usuario
import app.timali.UsuarioRole
import app.timali.UsuarioRoleGroup
import groovy.util.logging.Slf4j

@Slf4j
class UsuarioController {

    static responseFormats = ['json']

    def index() {
        log.info "=== UsuarioController.index() CHAMADO ==="

        try {
            def usuarios = Usuario.list(params)
            log.info "Usuários encontrados: ${usuarios.size()}"

            def result = usuarios.collect { usuario ->
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
                                    description: urg.roleGroup.description
                            ]
                        } ?: []
                ]
            }

            log.info "Retornando JSON com ${result.size()} usuários"
            respond result
        } catch (Exception e) {
            log.error "Erro: ${e.message}", e
            render(status: 500, contentType: "application/json") {
                [error: e.message]
            }
        }
    }
}