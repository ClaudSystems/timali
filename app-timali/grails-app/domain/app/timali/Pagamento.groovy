package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.annotation.Entity
import grails.rest.Resource

@GrailsCompileStatic
@Entity
@Resource(uri = '/api/pagamentos', formats = ['json'], readOnly = false)
class Pagamento implements Serializable {

    private static final long serialVersionUID = 1

    Credito credito
    Parcela parcela
    Entidade entidade
    Usuario usuario

    String numeroRecibo

    BigDecimal valorPago = 0.0
    BigDecimal valorParcela = 0.0
    BigDecimal valorJuros = 0.0
    BigDecimal valorMulta = 0.0
    BigDecimal valorJurosDemora = 0.0
    BigDecimal troco = 0.0

    String formaPagamento  // DINHEIRO, CARTAO, TRANSFERENCIA, CHEQUE, MPESA, E-MOLA
    String descricao
    String referenciaPagamento  // Número de referência para transferências/cheques

    Date dataPagamento = new Date()

    Date dateCreated
    Date lastUpdated
    String criadoPor
    String atualizadoPor

    static constraints = {
        credito nullable: false
        parcela nullable: true
        entidade nullable: false
        usuario nullable: false

        numeroRecibo nullable: false, blank: false, unique: true, maxSize: 50

        valorPago nullable: false, min: 0.0, scale: 2
        valorParcela nullable: true, min: 0.0, scale: 2
        valorJuros nullable: true, min: 0.0, scale: 2
        valorMulta nullable: true, min: 0.0, scale: 2
        valorJurosDemora nullable: true, min: 0.0, scale: 2
        troco nullable: true, min: 0.0, scale: 2

        formaPagamento nullable: false, inList: ['DINHEIRO', 'CARTAO', 'TRANSFERENCIA', 'CHEQUE', 'MPESA', 'E-MOLA']
        descricao nullable: true, maxSize: 500
        referenciaPagamento nullable: true, maxSize: 100

        dataPagamento nullable: false
        criadoPor nullable: true, maxSize: 100
        atualizadoPor nullable: true, maxSize: 100
    }

    static mapping = {
        table 'pagamento'
        id generator: 'sequence', params: [sequence: 'seq_pagamento']

        numeroRecibo index: 'idx_pagamento_recibo'
        credito index: 'idx_pagamento_credito'
        parcela index: 'idx_pagamento_parcela'
        entidade index: 'idx_pagamento_entidade'
        formaPagamento index: 'idx_pagamento_forma'
        dataPagamento index: 'idx_pagamento_data'

        sort dataPagamento: 'desc'
    }

    String toString() {
        return "Recibo: ${numeroRecibo} - ${valorPago} MZN"
    }
}