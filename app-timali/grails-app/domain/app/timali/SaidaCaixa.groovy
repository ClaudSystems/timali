// grails-app/domain/app/timali/SaidaCaixa.groovy
package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.annotation.Entity

@GrailsCompileStatic
@Entity
class SaidaCaixa implements Serializable {

    private static final long serialVersionUID = 1

    Usuario usuario
    Entidade entidade
    Diario diario

    String descricao
    String tipo
    String formaPagamento
    String referencia

    BigDecimal valor = 0.0

    Date dataSaida = new Date()

    Date dateCreated
    Date lastUpdated
    String criadoPor

    static belongsTo = [diario: Diario]

    static constraints = {
        usuario nullable: true
        entidade nullable: true
        diario nullable: true

        descricao nullable: false, blank: false, maxSize: 500
        tipo nullable: false, inList: ['DESPESA', 'REEMBOLSO', 'FORNECEDOR', 'SALARIO', 'MATERIAL', 'SERVICO', 'FEICHO_CAIXA', 'OUTRO']
        formaPagamento nullable: false, inList: ['DINHEIRO', 'TRANSFERENCIA', 'CHEQUE', 'CARTEIRA_MOVEL', 'CARTAO']
        referencia nullable: true, maxSize: 100

        valor nullable: false, min: 0.01, scale: 2

        dataSaida nullable: false
        criadoPor nullable: true, maxSize: 100
    }

    static mapping = {
        table 'saida_caixa'
        id generator: 'sequence', params: [sequence: 'seq_saida_caixa']
        sort dataSaida: 'desc'
        diario index: 'idx_saida_diario'
    }

    String toString() {
        return "Saída: ${descricao} - ${valor} MZN"
    }
}