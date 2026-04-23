package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.annotation.Entity
import grails.rest.Resource

@GrailsCompileStatic
@Entity
@Resource(uri = '/api/creditos', formats = ['json'], readOnly = false)
class Credito implements Serializable {

    private static final long serialVersionUID = 1

    Entidade entidade
    Usuario usuario
    DefinicaoCredito definicaoCredito

    String numero
    String descricao

    BigDecimal valorConcedido = 0.0
    BigDecimal valorTotal = 0.0

    // Copiados da definição no momento da criação
    BigDecimal percentualDeJuros = 0.0
    BigDecimal percentualJurosDeDemora = 0.0
    Integer numeroDePrestacoes
    Periodicidade periodicidade
    FormaCalculo formaDeCalculo
    PeriodicidadeMora periodicidadeMora
    Integer maximoCobrancasMora = 0

    Date dataEmissao = new Date()
    Date dataValidade

    Boolean ativo = true
    Boolean emMora = false
    Boolean quitado = false
    Boolean ignorarPagamentosNoPrazo = false

    BigDecimal totalPrevisto = 0.0
    BigDecimal totalPago = 0.0
    BigDecimal totalPagoNoPrazo = 0.0
    BigDecimal totalEmDivida = 0.0
    BigDecimal totalJurosPago = 0.0
    BigDecimal totalMultaPago = 0.0
    BigDecimal totalJurosDemoraPago = 0.0

    BigDecimal valorRemissao = 0.0
    String motivoRemissao

    StatusCredito status = StatusCredito.ATIVO

    Date dateCreated
    Date lastUpdated
    String criadoPor
    String atualizadoPor

    static hasMany = [parcelas: Parcela]

    static constraints = {
        entidade nullable: false
        usuario nullable: false
        definicaoCredito nullable: false

        numero nullable: false, blank: false, unique: true, maxSize: 50
        descricao nullable: true, maxSize: 500

        valorConcedido nullable: false, min: 0.0, scale: 2
        valorTotal nullable: false, min: 0.0, scale: 2

        percentualDeJuros nullable: false, min: 0.0, scale: 4
        percentualJurosDeDemora nullable: false, min: 0.0, scale: 4
        numeroDePrestacoes nullable: false, min: 1
        periodicidade nullable: false
        formaDeCalculo nullable: false
        periodicidadeMora nullable: true
        maximoCobrancasMora nullable: false, min: 0

        dataEmissao nullable: false
        dataValidade nullable: true

        ativo nullable: false
        emMora nullable: false
        quitado nullable: false
        ignorarPagamentosNoPrazo nullable: false

        totalPrevisto nullable: false, min: 0.0, scale: 2
        totalPago nullable: false, min: 0.0, scale: 2
        totalPagoNoPrazo nullable: false, min: 0.0, scale: 2
        totalEmDivida nullable: false, min: 0.0, scale: 2
        totalJurosPago nullable: false, min: 0.0, scale: 2
        totalMultaPago nullable: false, min: 0.0, scale: 2
        totalJurosDemoraPago nullable: false, min: 0.0, scale: 2

        valorRemissao nullable: true, min: 0.0, scale: 2
        motivoRemissao nullable: true, maxSize: 500

        status nullable: false
        criadoPor nullable: true, maxSize: 100
        atualizadoPor nullable: true, maxSize: 100
    }

    static mapping = {
        table 'credito'
        id generator: 'sequence', params: [sequence: 'seq_credito']
        parcelas cascade: 'all-delete-orphan', batchSize: 20
        sort dataEmissao: 'desc'

        numero index: 'idx_credito_numero'
        entidade index: 'idx_credito_entidade'
        status index: 'idx_credito_status'
    }
}

enum StatusCredito {
    RASCUNHO('Rascunho'),
    ATIVO('Ativo'),
    EM_ATRASO('Em Atraso'),
    QUITADO('Quitado'),
    CANCELADO('Cancelado'),
    RENEGOCIADO('Renegociado')

    final String descricao

    StatusCredito(String descricao) {
        this.descricao = descricao
    }

    String toString() {
        return descricao
    }
}