package app.timali

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.core.annotation.Order

@Configuration
class SecurityConfig {

    @Bean
    @Order(-100) // Ordem muito alta para garantir que seja processado cedo
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration()
        
        // Permitir o frontend
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"))
        
        // Permitir métodos HTTP
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"))
        
        // Permitir headers
        configuration.setAllowedHeaders(Arrays.asList("*"))
        
        // Permitir credenciais
        configuration.setAllowCredentials(true)
        
        // Expor Authorization para o frontend ler o JWT
        configuration.setExposedHeaders(Arrays.asList("Authorization"))
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }
}
