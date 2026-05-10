// grails-app/domain/app/timali/Diario.groovy
package app.timali

import grails.compiler.GrailsCompileStatic
import grails.gorm.annotation.Entity

@GrailsCompileStatic
@Entity
class Diario implements Serializable {

    private static final long serialVersionUID = 1

    String numeroDiario
    String estado = "aberto"

    Date dataReferencia
    Date dateCreated
    Date lastUpdated
    Date dateClosed

    BigDecimal totalRecebimentos = 0.0
    BigDecimal totalSaidas = 0.0
    BigDecimal saldo = 0.0

    String notas

    Usuario usuario
    String criadoPor
    String fechadoPor

    static hasMany = [pagamentos: Pagamento, saidas: SaidaCaixa]

    static final List<String> TIPOS_SAIDAS_ATIVAS = ['REEMBOLSO', 'FEICHO_CAIXA']
    static final List<String> TIPOS_SAIDAS_PASSIVAS = ['DESPESA', 'FORNECEDOR', 'SALARIO', 'MATERIAL', 'SERVICO', 'OUTRO']

    static constraints = {
        numeroDiario nullable: false, unique: true
        estado nullable: false, inList: ["aberto", "fechado", "pendente"]
        dataReferencia nullable: false, unique: true
        dateClosed nullable: true
        lastUpdated nullable: true
        totalRecebimentos min: 0.0, scale: 2
        totalSaidas min: 0.0, scale: 2
        saldo scale: 2
        notas nullable: true, maxSize: 2000
        usuario nullable: true
        criadoPor nullable: true
        fechadoPor nullable: true
    }

    static mapping = {
        table 'diario'
        id generator: 'sequence', params: [sequence: 'seq_diario']
        sort dataReferencia: 'desc'
        dataReferencia index: 'idx_diario_data', unique: true
        numeroDiario index: 'idx_diario_numero'
        notas type: 'text'
        pagamentos cascade: 'all-delete-orphan'
        saidas cascade: 'all-delete-orphan'
    }

    /**
     * Retorna as saídas ativas do diário
     */
    List<SaidaCaixa> getSaidasAtivas() {
        Set<SaidaCaixa> s = saidas
        if (!s) return []
        List<SaidaCaixa> result = []
        for (SaidaCaixa saida : s) {
            if (saida.tipo in TIPOS_SAIDAS_ATIVAS) {
                result.add(saida)
            }
        }
        return result
    }

    /**
     * Retorna as saídas passivas do diário
     */
    List<SaidaCaixa> getSaidasPassivas() {
        Set<SaidaCaixa> s = saidas
        if (!s) return []
        List<SaidaCaixa> result = []
        for (SaidaCaixa saida : s) {
            if (saida.tipo in TIPOS_SAIDAS_PASSIVAS) {
                result.add(saida)
            }
        }
        return result
    }

    /**
     * Calcula o total de saídas ativas
     */
    BigDecimal getTotalSaidasAtivas() {
        List<SaidaCaixa> ativas = getSaidasAtivas()
        BigDecimal total = 0.0
        for (SaidaCaixa s : ativas) {
            BigDecimal v = s.valor ?: 0.0
            total = total + v
        }
        return total
    }

    /**
     * Calcula o total de saídas passivas
     */
    BigDecimal getTotalSaidasPassivas() {
        List<SaidaCaixa> passivas = getSaidasPassivas()
        BigDecimal total = 0.0
        for (SaidaCaixa s : passivas) {
            BigDecimal v = s.valor ?: 0.0
            total = total + v
        }
        return total
    }

    /**
     * Atualiza todos os totais do diário com base nas movimentações associadas
     */
    void atualizarTotais() {
        BigDecimal recTotal = 0.0
        Set<Pagamento> pags = pagamentos
        if (pags) {
            for (Pagamento p : pags) {
                recTotal = recTotal + (p.valorPago ?: 0.0)
            }
        }
        this.totalRecebimentos = recTotal

        BigDecimal saidasTotal = 0.0
        Set<SaidaCaixa> saidasSet = saidas
        if (saidasSet) {
            for (SaidaCaixa s : saidasSet) {
                saidasTotal = saidasTotal + (s.valor ?: 0.0)
            }
        }
        this.totalSaidas = saidasTotal

        this.saldo = this.totalRecebimentos - this.totalSaidas
        this.lastUpdated = new Date()
    }

    /**
     * Fecha o diário
     */
    void fechar(String fechadoPorUsuario, String notasDiario = null) {
        atualizarTotais()
        this.estado = 'fechado'
        this.dateClosed = new Date()
        this.fechadoPor = fechadoPorUsuario
        if (notasDiario) this.notas = notasDiario
        this.lastUpdated = new Date()
    }

    String toString() {
        return "${numeroDiario}"
    }
}