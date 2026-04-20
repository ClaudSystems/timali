import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter

// Place your Spring DSL code here
beans = {
    corsConfigurationSource(UrlBasedCorsConfigurationSource) {
        CorsConfiguration config = new CorsConfiguration()
        config.allowedOrigins = ['http://localhost:3000']
        config.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
        config.allowedHeaders = ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With']
        config.allowCredentials = true
        config.maxAge = 3600L
        registerCorsConfiguration("/**", config)
    }

    // Definimos o corsFilter como um filtro padrão para ser usado na chainMap
    corsFilter(CorsFilter, ref('corsConfigurationSource'))
}
