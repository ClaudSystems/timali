package app.timali

class UrlMappings {

    static mappings = {
        // Rotas da API explicitas para Entidade
        // GET /api/entidades -> index
        // POST /api/entidades -> save
        "/api/entidades"(controller: "entidade") {
            action = [GET: "index", POST: "save"]
        }

        // Rotas com ID
        // GET /api/entidades/5 -> show
        // PUT /api/entidades/5 -> update
        // DELETE /api/entidades/5 -> delete
        "/api/entidades/$id"(controller: "entidade") {
            action = [GET: "show", PUT: "update", PATCH: "update", DELETE: "delete"]
            constraints {
                id matches: /\d+/
            }
        }
        
        // Rota para verificação de código
        "/api/entidades/verificar-codigo/$codigo"(controller: "entidade", action: "verificarCodigo")

        // Rota principal e fallback para o React (SPA)
        "/"(controller: "react", action: "index")
        
        // Exclui as rotas de API do fallback do React
        "/**"(controller: "react", action: "index") {
            constraints {
                uri = /^(?!\/api\/).*/
            }
        }

        "500"(view:'/error')
        "404"(view:'/notFound')
    }
}
