package app.timali

import grails.validation.Validateable

class RegistroPagamentoCommand implements Validateable {
    Long creditoId
    Long parcelaId
    BigDecimal valorPago
    BigDecimal valorParcela
    BigDecimal valorJuros
    BigDecimal valorMulta
    BigDecimal valorJurosDemora
    String formaPagamento
    String descricao
    String referenciaPagamento
    Date dataPagamento
    String username

    static constraints = {
        creditoId nullable: false
        parcelaId nullable: true
        valorPago nullable: false, min: 0.01, scale: 2
        valorParcela nullable: true, min: 0.0, scale: 2
        valorJuros nullable: true, min: 0.0, scale: 2
        valorMulta nullable: true, min: 0.0, scale: 2
        valorJurosDemora nullable: true, min: 0.0, scale: 2
        formaPagamento nullable: false, inList: [
                'DINHEIRO', 'PIX', 'TRANSFERENCIA', 'CARTAO_DEBITO',
                'CARTAO_CREDITO', 'BOLETO', 'CARTERIA_MOVEL', 'CHEQUE'
        ]
        descricao nullable: true, maxSize: 500
        referenciaPagamento nullable: true, maxSize: 100
        dataPagamento nullable: true
        username nullable: false, blank: false
    }
}