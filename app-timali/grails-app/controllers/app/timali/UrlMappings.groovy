
// grails-app/controllers/app/timali/UrlMappings.groovy
package app.timali

class UrlMappings {

    static mappings = {

        // ============================================================
        // API - ENTIDADES
        // ============================================================
        "/api/entidades/verificarCodigo"(controller: "entidade", action: "verificarCodigo")
        "/api/entidades/search"(controller: "entidade", action: "search")

        "/api/entidades"(resources: "entidade") {
            collection {
                '/search'(controller: 'entidade', action: 'search')
                '/verificarCodigo'(controller: 'entidade', action: 'verificarCodigo')
            }
        }

        // ============================================================
        // API - USUÁRIOS
        // ============================================================
        "/api/usuarios/$id/roles"(controller: "usuario", action: "updateRoles") {
            constraints { id matches: /\d+/ }
        }
        "/api/usuarios/$id/groups"(controller: "usuario", action: "updateGroups") {
            constraints { id matches: /\d+/ }
        }
        "/api/usuarios/$id/toggleStatus"(controller: "usuario", action: "toggleStatus") {
            constraints { id matches: /\d+/ }
        }
        "/api/usuarios/$id"(controller: "usuario") {
            action = [GET: "show", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/usuarios"(controller: "usuario") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - ROLES
        // ============================================================
        "/api/roles/initDefaults"(controller: "role", action: "initDefaults")
        "/api/roles/$id"(controller: "role") {
            action = [GET: "show", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/roles"(controller: "role") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - ROLE GROUPS
        // ============================================================
        "/api/roleGroups/initDefaults"(controller: "roleGroup", action: "initDefaults")
        "/api/roleGroups/$id"(controller: "roleGroup") {
            action = [GET: "show", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/roleGroups"(controller: "roleGroup") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - DEFINIÇÕES DE CRÉDITO
        // ============================================================
        "/api/definicoesCredito"(resources: 'definicaoCredito')

        // ============================================================
        // API - CRÉDITOS
        // ============================================================
        "/api/creditos/simulacao"(controller: "credito", action: "simulacao")
        "/api/creditos/recibosPorPeriodo"(controller: "credito", action: "recibosPorPeriodo")
        "/api/creditos/relatorioPagamentos"(controller: "credito", action: "relatorioPagamentos")
        "/api/creditos/pagamentosParcela"(controller: "credito", action: "pagamentosParcela")
        "/api/creditos/buscarCreditosPorCliente"(controller: "credito", action: "buscarCreditosPorCliente")
        "/api/creditos/buscarClientes"(controller: "credito", action: "buscarClientes")
        "/api/creditos/criar"(controller: "credito", action: "criarCreditoAction")
        "/api/creditos/recalcularTodos"(controller: "credito", action: "recalcularTodos")
        "/api/creditos/historicoPagamentos"(controller: "credito", action: "historicoPagamentos")
        "/api/creditos/pagamentosPorPeriodo"(controller: "credito", action: "pagamentosPorPeriodo")
        "/api/creditos/$creditoId/pagamentos"(controller: "credito", action: "buscarPagamentosPorCredito") {
            constraints { creditoId matches: /\d+/ }
        }
        "/api/creditos/$id/invalidar"(controller: "credito", action: "invalidar") {
            constraints { id matches: /\d+/ }
        }
        "/api/creditos/$id/arquivar"(controller: "credito", action: "arquivar") {
            constraints { id matches: /\d+/ }
        }
        "/api/creditos/$id/extrato"(controller: "credito", action: "extrato") {
            constraints { id matches: /\d+/ }
        }
        "/api/creditos/$id/recalcular"(controller: "credito", action: "recalcular") {
            constraints { id matches: /\d+/ }
        }
        "/api/creditos/$creditoId/parcelas"(controller: "credito", action: "parcelas") {
            constraints { creditoId matches: /\d+/ }
        }
        "/api/creditos/$creditoId/parcelas/$parcelaId/pagar"(controller: "credito", action: "registrarPagamento") {
            constraints {
                creditoId matches: /\d+/
                parcelaId matches: /\d+/
            }
        }
        "/api/creditos/$id"(controller: "credito") {
            action = [GET: "mostrar", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/creditos"(controller: "credito") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - SETTINGS
        // ============================================================
        "/api/settings"(resources: 'settings')

        // ============================================================
        // API - PAGAMENTOS
        // ============================================================
        "/api/pagamentos/buscarCreditos"(controller: "pagamento", action: "buscarCreditosPorCliente")
        "/api/pagamentos/buscarParcelas/$creditoId"(controller: "pagamento", action: "buscarParcelas") {
            constraints { creditoId matches: /\d+/ }
        }
        "/api/pagamentos/calcularMora/$parcelaId"(controller: "pagamento", action: "calcularMora") {
            constraints { parcelaId matches: /\d+/ }
        }
        "/api/pagamentos/registrar"(controller: "pagamento", action: "registrarPagamento")
        "/api/pagamentos/resumo"(controller: "pagamento", action: "resumoCaixa")
        "/api/pagamentos/doDia"(controller: "pagamento", action: "pagamentosDoDia")
        "/api/pagamentos/recibo/$id"(controller: "pagamento", action: "gerarRecibo") {
            constraints { id matches: /\d+/ }
        }
        "/api/pagamentos/$id"(controller: "pagamento") {
            action = [GET: "show", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/pagamentos"(controller: "pagamento") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - SAÍDAS DE CAIXA
        // ============================================================
        "/api/saidasCaixa/porPeriodo"(controller: "saidaCaixa", action: "saidasPorPeriodo")
        "/api/saidasCaixa/resumo"(controller: "saidaCaixa", action: "resumoSaidas")
        "/api/saidasCaixa/$id"(controller: "saidaCaixa") {
            action = [GET: "show", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/saidasCaixa"(controller: "saidaCaixa") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - DIÁRIO
        // ============================================================
        "/api/diarios/verificar"(controller: "diario", action: "verificar")
        "/api/diarios/buscar"(controller: "diario", action: "buscar")
        "/api/diarios/gerar"(controller: "diario", action: "gerarDiario")
        "/api/diarios/fechar"(controller: "diario", action: "fecharDiario")
        "/api/diarios/reabrir"(controller: "diario", action: "reabrir")
        "/api/diarios/fecharManual"(controller: "diario", action: "fecharDiario")
        "/api/diarios/porPeriodo"(controller: "diario", action: "diariosPorPeriodo")
        "/api/diarios/$id"(controller: "diario") {
            action = [GET: "show", PUT: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/diarios"(controller: "diario") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - DOCUMENTO
        // ============================================================
        "/api/documentos/upload"(controller: "documento", action: "upload")
        "/api/documentos/$id/download"(controller: "documento", action: "download") {
            constraints { id matches: /\d+/ }
        }
        "/api/documentos/$id"(controller: "documento") {
            action = [GET: "show", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }
        "/api/documentos"(controller: "documento") {
            action = [GET: "index"]
        }

        // ============================================================
        // API - RELATÓRIOS
        // ============================================================
        "/api/relatorios/dashboardAnalitico"(controller: "relatorio", action: "dashboardAnalitico")
        "/api/relatorios/creditosEmitidos"(controller: "relatorio", action: "creditosEmitidos")
        "/api/relatorios/creditosPorGestor"(controller: "relatorio", action: "creditosPorGestor")
        "/api/relatorios/prestacoesPorVencimento"(controller: "relatorio", action: "prestacoesPorVencimento")
        "/api/relatorios/pagamentosRecebidos"(controller: "relatorio", action: "pagamentosRecebidos")
        "/api/relatorios/saidas"(controller: "relatorio", action: "saidas")
        "/api/relatorios/diarios"(controller: "relatorio", action: "diarios")
        "/api/relatorios/creditosEmMora"(controller: "relatorio", action: "creditosEmMora")
        "/api/relatorios/usuarios"(controller: "relatorio", action: "usuarios")
        "/api/relatorios/usuariosComCreditos"(controller: "relatorio", action: "usuariosComCreditos")
        "/api/relatorios/clientesComAtrasos"(controller: "relatorio", action: "clientesComAtrasos")
        "/api/relatorios/gestores"(controller: "relatorio", action: "gestores")
        "/api/relatorios/avaliarCliente/$clienteId"(controller: "relatorio", action: "avaliarCliente") {
            constraints { clienteId matches: /\d+/ }
        }
        // ============================================================
        // ROTAS DO REACT (SPA)
        // ============================================================
        "/"(controller: "react", action: "index")
        "/**"(controller: "react", action: "index") {
            constraints {
                uri = ~/^(?!\/api\/).*/
            }
        }

        // ============================================================
        // PÁGINAS DE ERRO
        // ============================================================
        "500"(view: '/error')
        "404"(view: '/notFound')
    }
}