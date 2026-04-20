import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.core.Ordered

// Place your Spring DSL code here
beans = {
    corsConfigurationSource(UrlBasedCorsConfigurationSource) {
        CorsConfiguration config = new CorsConfiguration()
        
        // Configurações sugeridas
        config.allowedOrigins = ['http://localhost:3000']
        config.allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
        config.allowedHeaders = ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With']
        config.allowCredentials = true
        config.maxAge = 3600L
        
        registerCorsConfiguration("/**", config)
    }

    // Filtro CORS com prioridade máxima
    corsFilter(CorsFilter, ref('corsConfigurationSource'))

    corsFilterRegistration(FilterRegistrationBean) {
        filter = ref('corsFilter')
        urlPatterns = ['/*']
        order = Ordered.HIGHEST_PRECEDENCE // Garante que corre antes do Spring Security
    }
}
