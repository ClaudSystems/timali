package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.annotation.Entity
import grails.rest.Resource


@GrailsCompileStatic
@Entity
// @Resource(uri = '/api/creditos', formats = ['json'], readOnly = false)
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

        valorRemissao nullable: true, min: 0.0, scale: 2
        motivoRemissao nullable: true, maxSize: 500

        status nullable: false
        criadoPor nullable: true, maxSize: 100
        atualizadoPor nullable: true, maxSize: 100
    }

    // Métodos getters calculados baseados nas parcelas
    BigDecimal getTotalPrevisto() {
        try {
            if (!parcelas) return BigDecimal.ZERO
            return (parcelas.sum { it?.valorParcela ?: BigDecimal.ZERO } ?: BigDecimal.ZERO) as BigDecimal
        } catch (Exception e) {
            return BigDecimal.ZERO
        }
    }

    BigDecimal getTotalPago() {
        try {
            if (!parcelas) return BigDecimal.ZERO
            return (parcelas.sum { it?.valorPago ?: BigDecimal.ZERO } ?: BigDecimal.ZERO) as BigDecimal
        } catch (Exception e) {
            return BigDecimal.ZERO
        }
    }

    BigDecimal getTotalPagoNoPrazo() {
        try {
            if (!parcelas) return BigDecimal.ZERO
            return (parcelas.findAll { it?.pagoNoPrazo }?.sum { it?.valorPago ?: BigDecimal.ZERO } ?: BigDecimal.ZERO) as BigDecimal
        } catch (Exception e) {
            return BigDecimal.ZERO
        }
    }

    BigDecimal getTotalEmDivida() {
        try {
            return getTotalPrevisto() - getTotalPago()
        } catch (Exception e) {
            return BigDecimal.ZERO
        }
    }

    BigDecimal getTotalJurosPago() {
        try {
            if (!parcelas) return BigDecimal.ZERO
            return (parcelas.sum { it?.valorPagoJuros ?: BigDecimal.ZERO } ?: BigDecimal.ZERO) as BigDecimal
        } catch (Exception e) {
            return BigDecimal.ZERO
        }
    }

    BigDecimal getTotalMultaPago() {
        try {
            if (!parcelas) return BigDecimal.ZERO
            return (parcelas.sum { it?.valorPagoMulta ?: BigDecimal.ZERO } ?: BigDecimal.ZERO) as BigDecimal
        } catch (Exception e) {
            return BigDecimal.ZERO
        }
    }

    BigDecimal getTotalJurosDemoraPago() {
        try {
            if (!parcelas) return BigDecimal.ZERO
            return (parcelas.sum { it?.valorPagoJurosDemora ?: BigDecimal.ZERO } ?: BigDecimal.ZERO) as BigDecimal
        } catch (Exception e) {
            return BigDecimal.ZERO
        }
    }

    static mapping = {
        table 'credito'
        id generator: 'sequence', params: [sequence: 'seq_credito']
        parcelas cascade: 'all-delete-orphan', batchSize: 20
        sort dataEmissao: 'desc'

        numero index: 'idx_credito_numero'
        entidade index: 'idx_credito_entidade'
        status index: 'idx_credito_status'
        
        percentualDeJuros sqlType: 'decimal(10,4)'
        percentualJurosDeDemora sqlType: 'decimal(10,4)'
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