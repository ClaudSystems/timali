package app.timali

import app.timali.Usuario
import app.timali.Role
import app.timali.UsuarioRole

class BootStrap {

    def init = { servletContext ->

        // ========== CONFIGURAÇÃO JWT ==========
        System.setProperty(
                'grails.plugin.springsecurity.rest.token.storage.jwt.secret',
                'timali-super-secret-key-for-jwt-2026-xyz-must-be-long-enough-to-work'
        )
        System.setProperty(
                'grails.plugin.springsecurity.rest.token.storage.jwt.expiration',
                '3600'
        )

        println "=" * 60
        println ">>> JWT Secret configurada via Bootstrap"
        println "=" * 60
        // =======================================================

        Usuario.withTransaction {
            // Criar as roles se não existirem
            def adminRole = Role.findByAuthority('ROLE_ADMIN') ?: new Role(authority: 'ROLE_ADMIN').save(flush: true)
            def userRole = Role.findByAuthority('ROLE_USER') ?: new Role(authority: 'ROLE_USER').save(flush: true)

            // Criar o utilizador Admin inicial se não existir
            def testUser = Usuario.findByUsername('admin')
            if (!testUser) {
                testUser = new Usuario(
                        username: 'admin',
                        password: '{noop}admin123'  // CORREÇÃO: Adicionado {noop} para senha em texto plano
                ).save(flush: true)

                // Ligar o utilizador à role de Admin
                if (!UsuarioRole.exists(testUser.id, adminRole.id)) {
                    UsuarioRole.create(testUser, adminRole, true)
                }

                // Ligar também à role de User
                if (!UsuarioRole.exists(testUser.id, userRole.id)) {
                    UsuarioRole.create(testUser, userRole, true)
                }
            } else {
                // Se o usuário já existir, atualiza a senha para ter o prefixo {noop}
                testUser.password = '{noop}admin123'
                testUser.save(flush: true)

                // Garante que tem as roles
                if (!UsuarioRole.exists(testUser.id, adminRole.id)) {
                    UsuarioRole.create(testUser, adminRole, true)
                }
                if (!UsuarioRole.exists(testUser.id, userRole.id)) {
                    UsuarioRole.create(testUser, userRole, true)
                }
            }

            println ">>> BootStrap: Utilizador 'admin' garantido com sucesso."
        }
    }

    def destroy = {
    }
}