package app.timali

class UrlMappings {

    static mappings = {


        // ============================================================
        // API - ENTIDADES
        // ============================================================
        "/api/entidades"(resources: 'entidade')
        "/api/entidades/verificar-codigo/$codigo"(controller: "entidade", action: "verificarCodigo")

        // ============================================================
        // API - USUÁRIOS
        // ============================================================
        "/api/usuarios"(resources: 'usuario')

        // ============================================================
        // API - DEFINIÇÕES DE CRÉDITO
        // ============================================================
        "/api/definicoesCredito"(resources: 'definicaoCredito')

        // ============================================================
        // API - CRÉDITOS
        // ============================================================

        // Rotas específicas PRIMEIRO
        "/api/creditos/buscar-clientes"(controller: "credito", action: "buscarClientes")
        "/api/creditos/criar"(controller: "credito", action: "criarCreditoAction")

        // NOVA ROTA: Recalcular todos os créditos
        "/api/creditos/recalcular-todos"(controller: "credito", action: "recalcularTodos")

        // Rotas com path adicional
        "/api/creditos/$id/invalidar"(controller: "credito", action: "invalidar") {
            constraints { id matches: /\d+/ }
        }
        "/api/creditos/$id/arquivar"(controller: "credito", action: "arquivar") {
            constraints { id matches: /\d+/ }
        }
        "/api/creditos/$id/extrato"(controller: "credito", action: "extrato") {
            constraints { id matches: /\d+/ }
        }

        // NOVA ROTA: Recalcular um crédito específico
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

        // Rota com ID (GET usa "mostrar")
        "/api/creditos/$id"(controller: "credito") {
            action = [GET: "mostrar", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }

        // Rota sem ID (GET usa "index", POST usa "save")
        "/api/creditos"(controller: "credito") {
            action = [GET: "index", POST: "save"]
        }

        // ============================================================
        // API - SETTINGS (NOVO)
        // ============================================================
        "/api/settings"(resources: 'settings')

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