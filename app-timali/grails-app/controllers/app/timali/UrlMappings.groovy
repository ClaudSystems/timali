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
        "/api/creditos/recibosPorPeriodo"(controller: "credito", action: "recibosPorPeriodo")
        "/api/creditos/relatorioPagamentos"(controller: "credito", action: "relatorioPagamentos")
        // Rotas específicas PRIMEIRO
        // Adicione ANTES das outras rotas de crédito
// Na seção de créditos:
        "/api/creditos/$creditoId/pagamentos"(controller: "credito", action: "buscarPagamentosPorCredito") {
            constraints { creditoId matches: /\d+/ }
        }
        "/api/creditos/historicoPagamentos"(controller: "credito", action: "historicoPagamentos")
        "/api/creditos/pagamentosPorPeriodo"(controller: "credito", action: "pagamentosPorPeriodo")
        "/api/creditos/buscarCreditosPorCliente"(controller: "credito", action: "buscarCreditosPorCliente")
        "/api/creditos/buscarClientes"(controller: "credito", action: "buscarClientes")

        "/api/creditos/criar"(controller: "credito", action: "criarCreditoAction")

        // NOVA ROTA: Recalcular todos os créditos
        "/api/creditos/recalcularTodos"(controller: "credito", action: "recalcularTodos")

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
        // API - PAGAMENTOS (NOVO MÓDULO CAIXA)
        // ============================================================

        // Rotas específicas do Caixa PRIMEIRO
        "/api/pagamentos/buscarCreditos"(controller: "pagamento", action: "buscarCreditosPorCliente")
        "/api/pagamentos/registrar"(controller: "pagamento", action: "registrarPagamento")
        "/api/pagamentos/caixa/resumo"(controller: "pagamento", action: "resumoCaixa")
        "/api/pagamentos/caixa/hoje"(controller: "pagamento", action: "pagamentosDoDia")

        // Rotas com path adicional para parcelas
        "/api/pagamentos/$creditoId/parcelas"(controller: "pagamento", action: "buscarParcelas") {
            constraints { creditoId matches: /\d+/ }
        }
        "/api/pagamentos/$parcelaId/calcularMora"(controller: "pagamento", action: "calcularMora") {
            constraints { parcelaId matches: /\d+/ }
        }

        // Rota de recibo
        "/api/pagamentos/$id/recibo"(controller: "pagamento", action: "gerarRecibo") {
            constraints { id matches: /\d+/ }
        }

        // Rota com ID (GET usa "mostrar")
        "/api/pagamentos/$id"(controller: "pagamento") {
            action = [GET: "mostrar", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints { id matches: /\d+/ }
        }

        // Rota sem ID (GET usa "index", POST usa "save")
        "/api/pagamentos"(controller: "pagamento") {
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