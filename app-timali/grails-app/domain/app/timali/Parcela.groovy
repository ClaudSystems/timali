// grails-app/domain/app/timali/Parcela.groovy
package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.annotation.Entity
import java.math.RoundingMode

@GrailsCompileStatic
@Entity
class Parcela implements Serializable {

    private static final long serialVersionUID = 1

    Credito credito
    BigDecimal valorRemissao = 0.0 // valor do perdão da parcela
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
    Integer cobrancasMoraAplicadas = 0

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
        valorRemissao nullable: false, min: 0.0, scale: 2  // ← CORRIGIDO: nullble → nullable
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

    // =========================================================================
    // MÉTODOS DE CÁLCULO DE MORA
    // =========================================================================

    /**
     * Calcula o valor da mora (juros de demora) baseado nas definições do crédito
     * @return BigDecimal com o valor calculado da mora
     */
    BigDecimal calcularValorMora() {
        if (!credito || pago || !emMora || diasAtraso <= 0) {
            return BigDecimal.ZERO
        }

        // Verificar se o crédito tem configuração de mora
        BigDecimal percentualJurosDemora = credito.percentualJurosDeDemora ?: BigDecimal.ZERO
        if (percentualJurosDemora.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO
        }

        int maximoCobrancasMora = credito.maximoCobrancasMora ?: 0
        def periodicidadeMora = credito.periodicidadeMora
        boolean ignorarPagamentosNoPrazo = credito.ignorarPagamentosNoPrazo ?: false

        // Definir valor base para cálculo
        BigDecimal valorBase
        if (ignorarPagamentosNoPrazo) {
            // Cobra sobre o valor TOTAL da parcela
            valorBase = valorParcela ?: BigDecimal.ZERO
        } else {
            // Desconta pagamentos parciais já feitos
            valorBase = (valorParcela ?: BigDecimal.ZERO) - (valorPago ?: BigDecimal.ZERO)
        }

        if (valorBase.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO
        }

        // Calcular dias por cobrança baseado na periodicidade
        int diasPorCobranca = 1 // Padrão: diário
        if (periodicidadeMora) {
            String perMora = periodicidadeMora.toString().toUpperCase()
            if (perMora.contains('SEMANAL')) {
                diasPorCobranca = 7
            } else if (perMora.contains('QUINZENAL')) {
                diasPorCobranca = 15
            } else if (perMora.contains('MENSAL')) {
                diasPorCobranca = 30
            }
        }

        // Calcular número de cobranças devidas
        int cobrancasDevidas = (diasAtraso / diasPorCobranca) as Integer

        // Aplicar limite máximo de cobranças
        if (maximoCobrancasMora > 0 && cobrancasDevidas > maximoCobrancasMora) {
            cobrancasDevidas = maximoCobrancasMora
        }

        // Não cobrar mais do que já foi aplicado
        if (cobrancasDevidas <= cobrancasMoraAplicadas) {
            return BigDecimal.ZERO
        }

        // Calcular valor da mora
        BigDecimal taxaMora = percentualJurosDemora.divide(new BigDecimal(100), 10, RoundingMode.HALF_UP)
        BigDecimal valorMora = valorBase.multiply(taxaMora)
                .multiply(new BigDecimal(cobrancasDevidas))
                .setScale(2, RoundingMode.HALF_UP)

        return valorMora
    }

    /**
     * Calcula e atualiza o valor da mora na parcela
     * @return true se houve alteração no valor
     */
    boolean atualizarMora() {
        if (!credito || pago) {
            return false
        }

        Date hoje = zerarHora(new Date())
        
        // Verificar se está vencida
        if (dataVencimento.before(hoje)) {
            long diffMillis = hoje.time - dataVencimento.time
            int diasAtrasoCalculado = (diffMillis / (1000 * 60 * 60 * 24)) as Integer

            if (diasAtrasoCalculado > 0) {
                this.diasAtraso = diasAtrasoCalculado
                this.emMora = true
                this.status = StatusParcela.VENCIDA

                BigDecimal novaMora = calcularValorMora()
                
                if (novaMora.compareTo(valorJurosDemora ?: BigDecimal.ZERO) != 0) {
                    this.valorJurosDemora = novaMora
                    
                    // Atualizar contador de cobranças aplicadas
                    int maximoCobrancasMora = credito.maximoCobrancasMora ?: 0
                    def periodicidadeMora = credito.periodicidadeMora
                    
                    int diasPorCobranca = 1
                    if (periodicidadeMora) {
                        String perMora = periodicidadeMora.toString().toUpperCase()
                        if (perMora.contains('SEMANAL')) diasPorCobranca = 7
                        else if (perMora.contains('QUINZENAL')) diasPorCobranca = 15
                        else if (perMora.contains('MENSAL')) diasPorCobranca = 30
                    }
                    
                    int cobrancasDevidas = (diasAtraso / diasPorCobranca) as Integer
                    if (maximoCobrancasMora > 0 && cobrancasDevidas > maximoCobrancasMora) {
                        cobrancasDevidas = maximoCobrancasMora
                    }
                    this.cobrancasMoraAplicadas = cobrancasDevidas
                    
                    return true
                }
            }
        }
        
        return false
    }

    /**
     * Zera hora/minuto/segundo/milissegundo de uma data
     */
    private Date zerarHora(Date data) {
        if (!data) return null
        Calendar cal = Calendar.getInstance()
        cal.setTime(data)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.time
    }

    /**
     * Getter calculado para valor total devido (parcela + mora)
     */
    BigDecimal getValorTotalDevido() {
        return (valorParcela ?: BigDecimal.ZERO) + (valorJurosDemora ?: BigDecimal.ZERO) + (valorMulta ?: BigDecimal.ZERO)
    }

    /**
     * Getter calculado para saldo restante incluindo mora
     */
    BigDecimal getSaldoRestanteComMora() {
        return getValorTotalDevido() - (valorPago ?: BigDecimal.ZERO)
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