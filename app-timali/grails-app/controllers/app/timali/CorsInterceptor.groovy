package app.timali

class CorsInterceptor {

    int order = HIGHEST_PRECEDENCE

    CorsInterceptor() {
        matchAll()
    }

    boolean before() {
        // Define headers CORS para TODAS as requisições
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept")
        response.setHeader("Access-Control-Allow-Credentials", "true")
        response.setHeader("Access-Control-Max-Age", "3600")
        response.setHeader("Access-Control-Expose-Headers", "Authorization")

        // Handle preflight requests (OPTIONS)
        if (request.method == 'OPTIONS') {
            response.status = 200
            render ""
            return false
        }
        
        return true
    }

    boolean after() { true }
    void afterView() { }
}
