import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import app.timali.GenericUpdateService


// Place your Spring DSL code here
beans = {

    // ========== CONFIGURAÇÃO CORS ==========
    corsConfigurationSource(UrlBasedCorsConfigurationSource) {
        CorsConfiguration config = new CorsConfiguration()
        config.allowedOrigins = ['http://localhost:3000', 'http://localhost:3001']
        config.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
        config.allowedHeaders = ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With', '*']
        config.allowCredentials = true
        config.maxAge = 3600L
        registerCorsConfiguration("/**", config)
    }

    corsFilter(CorsFilter, ref('corsConfigurationSource'))

    // ========== SERVICES ==========
    genericUpdateService(GenericUpdateService)



}