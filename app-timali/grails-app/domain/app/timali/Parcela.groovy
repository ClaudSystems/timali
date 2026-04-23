package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.annotation.Entity

@GrailsCompileStatic
@Entity
class Parcela implements Serializable {

    private static final long serialVersionUID = 1

    Credito credito
    BigDecimal valorRemissao =0.0 // valor do perdao da parcela
    Integer numero
    String descricao

    BigDecimal valorParcela = 0.0
    BigDecimal valorAmortizacao = 0.0
    BigDecimal valorJuros = 0.0
    BigDecimal saldoDevedor = 0.0

    BigDecimal valorPago = 0.0
    BigDecimal valorPagoAmortizacao = 0.0
    BigDecimal valorPagoJuros = 0.0

    BigDecimal valorMulta = 0.0
    BigDecimal valorJurosDemora = 0.0
    BigDecimal valorPagoMulta = 0.0
    BigDecimal valorPagoJurosDemora = 0.0

    Date dataVencimento
    Date dataPagamento
    Integer diasAtraso = 0
    Integer cobrancasMoraAplicadas = 0  // Quantas vezes já cobrou mora

    Boolean pago = false
    Boolean pagoNoPrazo = false
    Boolean emMora = false

    String formaPagamento
    String comprovativo

    StatusParcela status = StatusParcela.PENDENTE

    String observacao

    Date dateCreated
    Date lastUpdated
    String criadoPor
    String atualizadoPor

    static belongsTo = [credito: Credito]

    static constraints = {
        credito nullable: false

        numero nullable: false, min: 1
        descricao nullable: true, maxSize: 200
        valorRemissao nullble:  false, min: 0.0, scale: 2
        valorParcela nullable: false, min: 0.0, scale: 2
        valorAmortizacao nullable: false, min: 0.0, scale: 2
        valorJuros nullable: false, min: 0.0, scale: 2
        saldoDevedor nullable: false, min: 0.0, scale: 2

        valorPago nullable: false, min: 0.0, scale: 2
        valorPagoAmortizacao nullable: false, min: 0.0, scale: 2
        valorPagoJuros nullable: false, min: 0.0, scale: 2

        valorMulta nullable: false, min: 0.0, scale: 2
        valorJurosDemora nullable: false, min: 0.0, scale: 2
        valorPagoMulta nullable: false, min: 0.0, scale: 2
        valorPagoJurosDemora nullable: false, min: 0.0, scale: 2

        dataVencimento nullable: false
        dataPagamento nullable: true
        diasAtraso nullable: false, min: 0
        cobrancasMoraAplicadas nullable: false, min: 0

        pago nullable: false
        pagoNoPrazo nullable: false
        emMora nullable: false

        formaPagamento nullable: true, inList: [
                'DINHEIRO',
                'PIX',
                'TRANSFERENCIA',
                'CARTAO_DEBITO',
                'CARTAO_CREDITO',
                'BOLETO',
                'CARTERIA_MOVEL',
                'CHEQUE'
        ]
        comprovativo nullable: true, maxSize: 100

        status nullable: false
        observacao nullable: true, maxSize: 500

        criadoPor nullable: true, maxSize: 100
        atualizadoPor nullable: true, maxSize: 100
    }

    static mapping = {
        table 'parcela'
        id generator: 'sequence', params: [sequence: 'seq_parcela']
        sort numero: 'asc'
        batchSize 20

        credito index: 'idx_parcela_credito'
        status index: 'idx_parcela_status'
        dataVencimento index: 'idx_parcela_vencimento'
        pago index: 'idx_parcela_pago'
        emMora index: 'idx_parcela_mora'
    }

    String toString() {
        return "Parcela ${numero}/${credito?.numeroDePrestacoes}"
    }
}

enum StatusParcela {
    PENDENTE('Pendente'),
    VENCIDA('Vencida'),
    PAGA('Paga'),
    PAGA_COM_ATRASO('Paga com Atraso'),
    REMIDA('Remida'),
    CANCELADA('Cancelada')

    final String descricao

    StatusParcela(String descricao) {
        this.descricao = descricao
    }

    String toString() {
        return descricao
    }
}