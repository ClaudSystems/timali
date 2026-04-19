package app.timali

import org.springframework.core.io.ClassPathResource

class ReactController {

    def index() {
        // Obtém a URI pedida sem o contexto da aplicação
        String uri = request.getAttribute('javax.servlet.forward.request_uri') ?: request.requestURI
        if (request.contextPath && uri.startsWith(request.contextPath)) {
            uri = uri.substring(request.contextPath.length())
        }
        
        // Se for a raiz, serve o index.html
        if (uri == "/" || uri == "" || uri == null) {
            uri = "/index.html"
        }

        // Tenta encontrar o ficheiro físico em src/main/resources/public
        def resource = new ClassPathResource("public${uri}")

        if (resource.exists() && !uri.endsWith("/")) {
            // Define o Content-Type correto
            String contentType = servletContext.getMimeType(uri)
            if (uri.endsWith('.js')) contentType = 'text/javascript'
            else if (uri.endsWith('.css')) contentType = 'text/css'
            else if (uri.endsWith('.ico')) contentType = 'image/x-icon'
            else if (uri.endsWith('.png')) contentType = 'image/png'
            else if (uri.endsWith('.json')) contentType = 'application/json'
            else if (uri.endsWith('.svg')) contentType = 'image/svg+xml'

            response.contentType = contentType ?: 'application/octet-stream'
            
            try {
                response.outputStream << resource.inputStream
                response.outputStream.flush()
                return null
            } catch (Exception e) {
                // Em caso de erro ao ler o ficheiro
            }
        }

        // Fallback SPA: Serve o index.html para qualquer outra rota
        def indexResource = new ClassPathResource("public/index.html")
        if (indexResource.exists()) {
            render text: indexResource.inputStream.text, contentType: 'text/html', encoding: "UTF-8"
        } else {
            render status: 404, text: "index.html não encontrado"
        }
    }
}
