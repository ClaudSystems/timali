package app.timali

class CorsInterceptor {

    int order = HIGHEST_PRECEDENCE

    CorsInterceptor() {
        matchAll()
    }

    boolean before() {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        response.setHeader("Access-Control-Allow-Credentials", "true")
        response.setHeader("Access-Control-Max-Age", "3600")

        if (request.method == 'OPTIONS') {
            response.status = 200
            render "" // Interrompe o processamento e retorna vazio com status 200
            return false
        }
        return true
    }

    boolean after() { true }

    void afterView() { }
}
