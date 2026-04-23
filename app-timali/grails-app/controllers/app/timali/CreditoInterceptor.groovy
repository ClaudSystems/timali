// grails-app/controllers/app/timali/CreditoInterceptor.groovy
package app.timali

import grails.artefact.Interceptor
import grails.converters.JSON
import grails.gorm.transactions.Transactional
import org.springframework.beans.factory.annotation.Autowired

class CreditoInterceptor implements Interceptor {

    int order = HIGHEST_PRECEDENCE

    @Autowired
    CreditoService creditoService

    CreditoInterceptor() {
        match(uri: '/api/creditos')
    }

    @Transactional
    boolean before() {
        if (request.method == 'POST') {
            println "=" * 50
            println ">>> INTERCEPTOR: POST /api/creditos <<<"
            println "=" * 50

            def data = request.JSON
            println "Dados recebidos: ${data}"

            try {
                // Buscar entidade
                Entidade entidade = Entidade.get(data.entidadeId as Long)
                if (!entidade) {
                    render status: 404, text: [message: "Cliente não encontrado"] as JSON
                    return false
                }

                // Buscar definição
                DefinicaoCredito definicao = DefinicaoCredito.get(data.definicaoCreditoId as Long)
                if (!definicao) {
                    render status: 404, text: [message: "Definição não encontrada"] as JSON
                    return false
                }

                // Buscar usuário
                def usuario = Usuario.findByUsername('admin') ?: Usuario.list()?.first()
                if (!usuario) {
                    render status: 500, text: [message: "Usuário não encontrado"] as JSON
                    return false
                }

                // Criar crédito
                Credito credito = new Credito()
                credito.entidade = entidade
                credito.definicaoCredito = definicao
                credito.usuario = usuario
                credito.valorConcedido = data.valorConcedido as BigDecimal
                credito.percentualDeJuros = (data.percentualDeJuros ?: definicao.percentualDeJuros) as BigDecimal
                credito.percentualJurosDeDemora = (data.percentualJurosDeDemora ?: definicao.percentualJurosDeDemora) as BigDecimal
                credito.numeroDePrestacoes = data.numeroDePrestacoes ?: definicao.numeroDePrestacoes

                // Periodicidade
                if (data.periodicidade) {
                    credito.periodicidade = Periodicidade.valueOf(data.periodicidade)
                } else {
                    credito.periodicidade = definicao.periodicidade ?: Periodicidade.MENSAL
                }

                // Forma de cálculo
                if (data.formaDeCalculo) {
                    credito.formaDeCalculo = FormaCalculo.valueOf(data.formaDeCalculo)
                } else {
                    credito.formaDeCalculo = definicao.formaDeCalculo ?: FormaCalculo.JUROS_SIMPLES
                }

                credito.dataEmissao = new Date()
                credito.numero = "CRED-${System.currentTimeMillis()}"
                credito.descricao = data.descricao
                credito.ignorarPagamentosNoPrazo = data.ignorarPagamentosNoPrazo ?: false
                credito.criadoPor = usuario.username
                credito.status = StatusCredito.ATIVO
                credito.ativo = true

                credito.save(flush: true)

                creditoService.gerarParcelas(credito)

                println "Crédito criado: ${credito.id} - ${credito.numero}"

                render status: 201, text: [
                        id: credito.id,
                        numero: credito.numero,
                        message: "Crédito criado com sucesso"
                ] as JSON

                return false

            } catch (Exception e) {
                println "ERRO: ${e.message}"
                e.printStackTrace()
                render status: 500, text: [message: e.message] as JSON
                return false
            }
        }
        return true
    }

    boolean after() { true }
    void afterView() { }
}