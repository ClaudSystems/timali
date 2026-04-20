package app.timali

import app.timali.Usuario
import app.timali.Role
import app.timali.UsuarioRole

class BootStrap {

    def init = { servletContext ->
        
        Usuario.withTransaction {
            // Criar as roles se não existirem
            def adminRole = Role.findByAuthority('ROLE_ADMIN') ?: new Role(authority: 'ROLE_ADMIN').save(flush: true)
            def userRole = Role.findByAuthority('ROLE_USER') ?: new Role(authority: 'ROLE_USER').save(flush: true)

            // Criar o utilizador Admin inicial se não existir
            def testUser = Usuario.findByUsername('admin')
            if (!testUser) {
                testUser = new Usuario(
                    username: 'admin',
                    password: 'admin123'
                ).save(flush: true)

                // Ligar o utilizador à role de Admin
                if (!UsuarioRole.exists(testUser.id, adminRole.id)) {
                    UsuarioRole.create(testUser, adminRole, true)
                }
            }

            println ">>> BootStrap: Utilizador 'admin' garantido com sucesso."
        }
    }

    def destroy = {
    }
}
