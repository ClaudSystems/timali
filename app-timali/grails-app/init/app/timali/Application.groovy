package app.timali

import grails.boot.GrailsApp
import grails.boot.config.GrailsAutoConfiguration
import grails.plugins.metadata.*
import org.springframework.boot.web.servlet.FilterRegistrationBean
import org.springframework.context.annotation.Bean
import org.springframework.core.Ordered

@PluginSource
class Application extends GrailsAutoConfiguration {
    
    static void main(String[] args) {
        GrailsApp.run(Application, args)
    }
    
    @Bean
    FilterRegistrationBean corsFilterRegistration() {
        println "=" * 60
        println ">>> Registrando CorsFilter via @Bean"
        println "=" * 60
        
        FilterRegistrationBean registration = new FilterRegistrationBean()
        registration.setFilter(new CorsFilter())
        registration.addUrlPatterns("/*")
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE)
        registration.setName("corsFilter")
        return registration
    }
}