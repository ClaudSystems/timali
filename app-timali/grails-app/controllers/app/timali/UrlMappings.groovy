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
        "/api/definicoes-credito"(resources: 'definicaoCredito')

        // ============================================================
        // API - CRÉDITOS - ROTA MANUAL PRIMEIRO!
        // ============================================================
        "/api/creditos/criar"(controller: "credito", action: "criarCreditoAction")

        // ============================================================
        // API - CRÉDITOS (RESOURCES)
        // ============================================================
        "/api/creditos"(resources: 'credito') {
            collection {
                '/buscar-clientes'(controller: 'credito', action: 'buscarClientes')
            }
            member {
                '/invalidar'(controller: 'credito', action: 'invalidar')
                '/arquivar'(controller: 'credito', action: 'arquivar')
                '/extrato'(controller: 'credito', action: 'extrato')
                '/parcelas'(controller: 'credito', action: 'parcelas')
            }
        }

        "/api/creditos/$creditoId/parcelas/$parcelaId/pagar"(controller: 'credito', action: 'registrarPagamento') {
            constraints {
                creditoId matches: /\d+/
                parcelaId matches: /\d+/
            }
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