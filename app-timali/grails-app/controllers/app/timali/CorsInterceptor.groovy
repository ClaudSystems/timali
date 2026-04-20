package app.timali

import grails.web.mapping.mvc.UrlMappingsHandlerMapping

class CorsInterceptor {

    int order = HIGHEST_PRECEDENCE

    CorsInterceptor() {
        matchAll()
    }

    boolean before() {
        // Handle preflight requests (OPTIONS) primeiro
        if (request.method == 'OPTIONS') {
            response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
            response.setHeader("Access-Control-Allow-Credentials", "true")
            response.setHeader("Access-Control-Max-Age", "3600")
            response.setHeader("Access-Control-Expose-Headers", "Authorization")
            response.status = 200
            render ""
            return false
        }

        // Define headers CORS para outras requisições
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        response.setHeader("Access-Control-Allow-Credentials", "true")
        response.setHeader("Access-Control-Max-Age", "3600")
        response.setHeader("Access-Control-Expose-Headers", "Authorization")
        
        return true
    }

    boolean after() { true }
    void afterView() { }
}
