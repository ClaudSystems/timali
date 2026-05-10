package app.timali

import app.timali.Usuario
import app.timali.Role
import app.timali.UsuarioRole
import app.timali.RoleGroup
import app.timali.UsuarioRoleGroup
import grails.gorm.transactions.Transactional

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
        // Inicializa as configurações do sistema
        initSettings()

        // =======================================================
        // Inicializa Roles, Grupos e Usuários
        Usuario.withTransaction {
            initRoles()
            initRoleGroups()
            initDefaultUsers()
        }

        // Recalcular totais de todos os créditos ao iniciar
        try {
            println "🔄 Recalculando totais dos créditos..."
            creditoService.recalcularTodosCreditos()
            println "✅ Totais recalculados com sucesso!"
        } catch (Exception e) {
            println "⚠️ Erro ao recalcular: ${e.message}"
        }
    }

    def destroy = {
    }

    /**
     * Inicializa as configurações do sistema com valores padrão
     */
    @Transactional
    void initSettings() {
        if (Settings.count() == 0) {
            Settings settings = new Settings(
                    nome: 'default',
                    permitirDesembolsoComDivida: false,
                    pagamentosEmOrdem: false,
                    ignorarValorPagoNoPrazo: false,
                    pagarEmSequencia: false,
                    alterarDataPagamento: false
            )
            settings.save(flush: true, failOnError: true)
            println "=" * 60
            println ">>> Settings criadas com valores padrão!"
            println "=" * 60
        } else {
            println "=" * 60
            println ">>> Settings já existem! Total: ${Settings.count()}"
            println "=" * 60
        }
    }

    /**
     * Inicializa todas as roles do sistema
     */
    @Transactional
    void initRoles() {
        println "=" * 60
        println ">>> Inicializando Roles..."

        def roles = [
                // Roles básicas de autenticação
                [authority: 'ROLE_ADMIN', description: 'Administrador do sistema'],
                [authority: 'ROLE_USER', description: 'Usuário básico'],

                // Roles específicas do negócio
                [authority: 'ROLE_GERENTE', description: 'Gerente - Acesso a relatórios e gestão'],
                [authority: 'ROLE_GESTOR', description: 'Gestor - Aprovação e supervisão'],
                [authority: 'ROLE_CAIXA', description: 'Caixa - Operações de pagamento'],

                // Roles de CRUD para Entidades
                [authority: 'ROLE_ENTIDADE_CREATE', description: 'Criar entidades'],
                [authority: 'ROLE_ENTIDADE_READ', description: 'Visualizar entidades'],
                [authority: 'ROLE_ENTIDADE_UPDATE', description: 'Atualizar entidades'],
                [authority: 'ROLE_ENTIDADE_DELETE', description: 'Deletar entidades'],

                // Roles de CRUD para Créditos
                [authority: 'ROLE_CREDITO_CREATE', description: 'Criar créditos'],
                [authority: 'ROLE_CREDITO_READ', description: 'Visualizar créditos'],
                [authority: 'ROLE_CREDITO_UPDATE', description: 'Atualizar créditos'],
                [authority: 'ROLE_CREDITO_DELETE', description: 'Deletar créditos'],
                [authority: 'ROLE_CREDITO_RECALCULAR', description: 'Recalcular créditos'],
                [authority: 'ROLE_CREDITO_INVALIDAR', description: 'Invalidar créditos'],
                [authority: 'ROLE_CREDITO_ARQUIVAR', description: 'Arquivar créditos'],

                // Roles de CRUD para Pagamentos
                [authority: 'ROLE_PAGAMENTO_CREATE', description: 'Registrar pagamentos'],
                [authority: 'ROLE_PAGAMENTO_READ', description: 'Visualizar pagamentos'],
                [authority: 'ROLE_PAGAMENTO_DELETE', description: 'Deletar pagamentos'],
                [authority: 'ROLE_PAGAMENTO_RECIBO', description: 'Gerar recibos'],

                // Roles para Definições de Crédito
                [authority: 'ROLE_DEFINICAO_CREATE', description: 'Criar definições de crédito'],
                [authority: 'ROLE_DEFINICAO_READ', description: 'Visualizar definições de crédito'],
                [authority: 'ROLE_DEFINICAO_UPDATE', description: 'Atualizar definições de crédito'],
                [authority: 'ROLE_DEFINICAO_DELETE', description: 'Deletar definições de crédito'],

                // Roles para Saídas de Caixa
                [authority: 'ROLE_SAIDA_CAIXA_CREATE', description: 'Registrar saídas de caixa'],
                [authority: 'ROLE_SAIDA_CAIXA_READ', description: 'Visualizar saídas de caixa'],
                [authority: 'ROLE_SAIDA_CAIXA_UPDATE', description: 'Atualizar saídas de caixa'],
                [authority: 'ROLE_SAIDA_CAIXA_DELETE', description: 'Deletar saídas de caixa'],

                // Roles para Diário
                [authority: 'ROLE_DIARIO_READ', description: 'Visualizar diários'],
                [authority: 'ROLE_DIARIO_GERAR', description: 'Gerar diários'],
                [authority: 'ROLE_DIARIO_FECHAR', description: 'Fechar diários'],
                [authority: 'ROLE_DIARIO_REABRIR', description: 'Reabrir diários'],

                // Roles para Settings
                [authority: 'ROLE_SETTINGS_READ', description: 'Visualizar configurações'],
                [authority: 'ROLE_SETTINGS_UPDATE', description: 'Atualizar configurações'],

                // Roles para Usuários
                [authority: 'ROLE_USUARIO_CREATE', description: 'Criar usuários'],
                [authority: 'ROLE_USUARIO_READ', description: 'Visualizar usuários'],
                [authority: 'ROLE_USUARIO_UPDATE', description: 'Atualizar usuários'],
                [authority: 'ROLE_USUARIO_DELETE', description: 'Deletar usuários'],

                // Roles para Grupos de Roles
                [authority: 'ROLE_GROUP_CREATE', description: 'Criar grupos de roles'],
                [authority: 'ROLE_GROUP_READ', description: 'Visualizar grupos de roles'],
                [authority: 'ROLE_GROUP_UPDATE', description: 'Atualizar grupos de roles'],
                [authority: 'ROLE_GROUP_DELETE', description: 'Deletar grupos de roles']
        ]

        def createdRoles = []
        def existingRoles = []

        roles.each { roleData ->
            def existingRole = Role.findByAuthority(roleData.authority)
            if (!existingRole) {
                def role = new Role(authority: roleData.authority)
                role.save(flush: true, failOnError: true)
                createdRoles << roleData.authority
            } else {
                existingRoles << roleData.authority
            }
        }

        if (createdRoles) {
            println "✅ Roles criadas: ${createdRoles.size()}"
            createdRoles.each { println "   - ${it}" }
        }
        if (existingRoles) {
            println "ℹ️ Roles já existentes: ${existingRoles.size()}"
        }
        println "=" * 60
    }

    /**
     * Inicializa os grupos de roles padrão
     */
    @Transactional
    void initRoleGroups() {
        println ">>> Inicializando Grupos de Roles..."

        def groupsConfig = [
                [
                        name: 'ADMIN',
                        description: 'Administrador do sistema - Acesso total a todas as funcionalidades',
                        roleNames: [
                                'ROLE_ADMIN', 'ROLE_USER',
                                'ROLE_GERENTE', 'ROLE_GESTOR', 'ROLE_CAIXA',
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
                        description: 'Gerente - Gestão completa de créditos e relatórios financeiros',
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
                        description: 'Gestor - Supervisão e aprovação de operações',
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
                        description: 'Caixa - Operações de pagamento e recebimento',
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

        def createdGroups = []
        def existingGroups = []

        groupsConfig.each { groupConfig ->
            def existingGroup = RoleGroup.findByName(groupConfig.name)
            if (!existingGroup) {
                def group = new RoleGroup(
                        name: groupConfig.name,
                        description: groupConfig.description
                )

                // Adiciona as roles ao grupo
                groupConfig.roleNames.each { roleName ->
                    def role = Role.findByAuthority(roleName)
                    if (role) {
                        group.addToRoles(role)
                    } else {
                        println "⚠️ Role não encontrada: ${roleName}"
                    }
                }

                group.save(flush: true, failOnError: true)
                createdGroups << groupConfig.name
            } else {
                existingGroups << groupConfig.name
            }
        }

        if (createdGroups) {
            println "✅ Grupos criados: ${createdGroups.size()}"
            createdGroups.each { println "   - ${it}" }
        }
        if (existingGroups) {
            println "ℹ️ Grupos já existentes: ${existingGroups.size()}"
        }
        println "=" * 60
    }

    /**
     * Inicializa os usuários padrão do sistema
     */
    @Transactional
    void initDefaultUsers() {
        println ">>> Inicializando Usuários Padrão..."

        // Busca os grupos
        def adminGroup = RoleGroup.findByName('ADMIN')
        def gerenteGroup = RoleGroup.findByName('GERENTE')
        def gestorGroup = RoleGroup.findByName('GESTOR')
        def caixaGroup = RoleGroup.findByName('CAIXA')

        // Busca as roles básicas
        def adminRole = Role.findByAuthority('ROLE_ADMIN')
        def userRole = Role.findByAuthority('ROLE_USER')

        // ===============================================
        // Usuário ADMIN (existente ou criar)
        // ===============================================
        def adminUser = Usuario.findByUsername('admin')
        if (!adminUser) {
            adminUser = new Usuario(
                    username: 'admin',
                    password: '{noop}admin123',
                    enabled: true
            ).save(flush: true, failOnError: true)
            println "✅ Usuário 'admin' criado"
        } else {
            // Garante que a senha está correta
            adminUser.password = '{noop}admin123'
            adminUser.enabled = true
            adminUser.save(flush: true, failOnError: true)
            println "ℹ️ Usuário 'admin' atualizado"
        }

        // Garante roles básicas do admin
        if (!UsuarioRole.exists(adminUser.id, adminRole.id)) {
            UsuarioRole.create(adminUser, adminRole, true)
        }
        if (!UsuarioRole.exists(adminUser.id, userRole.id)) {
            UsuarioRole.create(adminUser, userRole, true)
        }

        // Atribui o grupo ADMIN ao usuário admin
        if (adminGroup && !UsuarioRoleGroup.exists(adminUser.id, adminGroup.id)) {
            UsuarioRoleGroup.create(adminUser, adminGroup, true)
            println "   ↳ Grupo ADMIN atribuído"
        }

        // ===============================================
        // Usuário GERENTE
        // ===============================================
        def gerenteUser = Usuario.findByUsername('gerente')
        if (!gerenteUser) {
            gerenteUser = new Usuario(
                    username: 'gerente',
                    password: '{noop}gerente123',
                    enabled: true
            ).save(flush: true, failOnError: true)
            println "✅ Usuário 'gerente' criado"
        } else {
            gerenteUser.password = '{noop}gerente123'
            gerenteUser.enabled = true
            gerenteUser.save(flush: true, failOnError: true)
            println "ℹ️ Usuário 'gerente' atualizado"
        }

        // Atribui roles e grupo
        if (!UsuarioRole.exists(gerenteUser.id, userRole.id)) {
            UsuarioRole.create(gerenteUser, userRole, true)
        }
        if (gerenteGroup && !UsuarioRoleGroup.exists(gerenteUser.id, gerenteGroup.id)) {
            UsuarioRoleGroup.create(gerenteUser, gerenteGroup, true)
            println "   ↳ Grupo GERENTE atribuído"
        }

        // ===============================================
        // Usuário GESTOR
        // ===============================================
        def gestorUser = Usuario.findByUsername('gestor')
        if (!gestorUser) {
            gestorUser = new Usuario(
                    username: 'gestor',
                    password: '{noop}gestor123',
                    enabled: true
            ).save(flush: true, failOnError: true)
            println "✅ Usuário 'gestor' criado"
        } else {
            gestorUser.password = '{noop}gestor123'
            gestorUser.enabled = true
            gestorUser.save(flush: true, failOnError: true)
            println "ℹ️ Usuário 'gestor' atualizado"
        }

        // Atribui roles e grupo
        if (!UsuarioRole.exists(gestorUser.id, userRole.id)) {
            UsuarioRole.create(gestorUser, userRole, true)
        }
        if (gestorGroup && !UsuarioRoleGroup.exists(gestorUser.id, gestorGroup.id)) {
            UsuarioRoleGroup.create(gestorUser, gestorGroup, true)
            println "   ↳ Grupo GESTOR atribuído"
        }

        // ===============================================
        // Usuário CAIXA
        // ===============================================
        def caixaUser = Usuario.findByUsername('caixa')
        if (!caixaUser) {
            caixaUser = new Usuario(
                    username: 'caixa',
                    password: '{noop}caixa123',
                    enabled: true
            ).save(flush: true, failOnError: true)
            println "✅ Usuário 'caixa' criado"
        } else {
            caixaUser.password = '{noop}caixa123'
            caixaUser.enabled = true
            caixaUser.save(flush: true, failOnError: true)
            println "ℹ️ Usuário 'caixa' atualizado"
        }

        // Atribui roles e grupo
        if (!UsuarioRole.exists(caixaUser.id, userRole.id)) {
            UsuarioRole.create(caixaUser, userRole, true)
        }
        if (caixaGroup && !UsuarioRoleGroup.exists(caixaUser.id, caixaGroup.id)) {
            UsuarioRoleGroup.create(caixaUser, caixaGroup, true)
            println "   ↳ Grupo CAIXA atribuído"
        }

        println "=" * 60
        println ">>> RESUMO DE USUÁRIOS:"
        println "   - admin   / admin123   (ADMIN - Acesso Total)"
        println "   - gerente / gerente123 (GERENTE)"
        println "   - gestor  / gestor123  (GESTOR)"
        println "   - caixa   / caixa123   (CAIXA)"
        println "=" * 60
    }
}