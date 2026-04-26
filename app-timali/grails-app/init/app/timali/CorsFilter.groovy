package app.timali

import javax.servlet.*
import javax.servlet.http.HttpServletRequest
import javax.servlet.http.HttpServletResponse
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.stereotype.Component

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class CorsFilter implements Filter {

    @Override
    void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res
        HttpServletRequest request = (HttpServletRequest) req

        // LOG PARA DEBUG
        println ">>> CorsFilter interceptou: ${request.method} ${request.requestURI}"

        // CORRIGIDO: Usa a origem da requisição (dinâmico) com fallback para localhost:3000
        String origin = request.getHeader("Origin")
        if (origin) {
            response.setHeader("Access-Control-Allow-Origin", origin)
        } else {
            response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
        }

        response.setHeader("Access-Control-Allow-Credentials", "true")
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        response.setHeader("Access-Control-Max-Age", "3600")
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With, Accept, Origin, Cache-Control")
        response.setHeader("Access-Control-Expose-Headers", "Authorization, Content-Type")

        // Se for uma requisição preflight (OPTIONS), retorna 200 imediatamente
        if ("OPTIONS".equalsIgnoreCase(request.method)) {
            println ">>> OPTIONS request - retornando 200 OK"
            response.status = HttpServletResponse.SC_OK
            response.writer.flush()  // ← ADICIONADO: Garante que a resposta seja enviada
        } else {
            chain.doFilter(req, res)
        }
    }

    @Override
    void init(FilterConfig filterConfig) {
        println "=" * 60
        println ">>> CorsFilter INICIALIZADO com sucesso!"
        println "=" * 60
    }

    @Override
    void destroy() {}
}