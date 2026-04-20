package app.timali

class UrlMappings {

    static mappings = {
        // Rotas da API
        "/api/entidades"(resources: "entidade")

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
