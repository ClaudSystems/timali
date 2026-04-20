import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.UrlBasedCorsConfigurationSource
import org.springframework.web.filter.CorsFilter
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.core.Ordered

beans = {
    corsConfigurationSource(UrlBasedCorsConfigurationSource) {
        CorsConfiguration config = new CorsConfiguration()
        config.allowCredentials = true
        config.addAllowedOrigin("http://localhost:3000")
        config.addAllowedHeader("*")
        config.addAllowedMethod("*")
        config.addExposedHeader("Authorization")
        registerCorsConfiguration("/**", config)
    }

    corsFilter(CorsFilter, ref('corsConfigurationSource'))

    corsFilterRegistration(FilterRegistrationBean) {
        filter = ref('corsFilter')
        order = Ordered.HIGHEST_PRECEDENCE
        urlPatterns = ['/*']
    }
}
