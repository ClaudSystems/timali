package app.timali

class UrlMappings {

    static mappings = {
        "/produtos"(resources: "produto")

        "/"(controller: "react", action: "index")

        // Mapeia tudo para o ReactController
        "/**"(controller: "react", action: "index")

        "500"(view:'/error')
        "404"(view:'/notFound')
    }
}
