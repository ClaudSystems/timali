import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter

// Place your Spring DSL code here
beans = {
    corsConfigurationSource(UrlBasedCorsConfigurationSource) {
        CorsConfiguration config = new CorsConfiguration()
        config.allowedOrigins = ['http://localhost:3000']
        config.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
        config.allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With']
        config.allowCredentials = true
        config.maxAge = 3600L
        registerCorsConfiguration("/**", config)
    }

    corsFilter(CorsFilter, ref('corsConfigurationSource')) {
        order = -100
    }
}
