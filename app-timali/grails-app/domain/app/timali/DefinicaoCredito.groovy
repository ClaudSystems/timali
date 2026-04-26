// grails-app/domain/app/timali/DefinicaoCredito.groovy
package app.timali

import grails.compiler.GrailsCompileStatic
import grails.rest.Resource

/**
 * Classe de domínio que representa a definição/template de um pacote de crédito.
 *
 * Esta classe serve como um "molde" que define as regras e parâmetros para a
 * geração de créditos. No momento da criação de um crédito concreto, o usuário
 * selecionará uma definição de crédito que será usada como base.
 */
@GrailsCompileStatic
@Resource(uri = '/api/definicoesCredito', formats = ['json'], readOnly = false)
class DefinicaoCredito {

    // =========================================================================
    // IDENTIFICAÇÃO E DESCRIÇÃO
    // =========================================================================

    String nome
    String descricao

    // =========================================================================
    // PARÂMETROS DE PRESTAÇÕES
    // =========================================================================

    Integer numeroDePrestacoes
    Periodicidade periodicidade

    static enum Periodicidade {
        DIARIO('Diário', 1),
        SEMANAL('Semanal', 7),
        QUINZENAL('Quinzenal', 15),
        MENSAL('Mensal', 30)

        final String descricao
        final int dias

        Periodicidade(String descricao, int dias) {
            this.descricao = descricao
            this.dias = dias
        }

        String toString() { descricao }
    }

    // =========================================================================
    // FORMA DE CÁLCULO
    // =========================================================================

    FormaCalculo formaDeCalculo

    static enum FormaCalculo {
        TAXA_FIXA('Taxa Fixa'),
        PMT('PMT - Prestações Fixas'),
        SAC('SAC - Amortização Constante'),
        JUROS_SIMPLES('Juros Simples'),
        JUROS_COMPOSTOS('Juros Compostos')

        final String descricao

        FormaCalculo(String descricao) {
            this.descricao = descricao
        }

        String toString() { descricao }
    }

    // =========================================================================
    // TAXAS E JUROS
    // =========================================================================

    BigDecimal percentualDeJuros = 0.0G
    BigDecimal percentualJurosDeDemora = 0.00G
    Taxa taxa

    // =========================================================================
    // CONFIGURAÇÃO DE MORAS (LIMITE DE COBRANÇAS POR ATRASO)
    // =========================================================================

    PeriodicidadeMora periodicidadeMora

    static enum PeriodicidadeMora {
        DIARIO('Diário', 1),
        SEMANAL('Semanal', 7),
        QUINZENAL('Quinzenal', 15),
        MENSAL('Mensal', 30)

        final String descricao
        final int dias

        PeriodicidadeMora(String descricao, int dias) {
            this.descricao = descricao
            this.dias = dias
        }

        String toString() { descricao }
    }

    /**
     * Número MÁXIMO de vezes que a mora será cobrada.
     * Exemplos:
     * - periodicidadeMora = DIARIO, maximoCobrancasMora = 30:
     *   Cobra no máximo 30 vezes, uma vez por dia.
     *   Após o 30º dia, mesmo se ainda houver atraso, não cobra mais mora.
     *
     * - periodicidadeMora = SEMANAL, maximoCobrancasMora = 10:
     *   Cobra no máximo 10 vezes, uma vez por semana.
     *   Após a 10ª semana, não cobra mais mora.
     *
     * - periodicidadeMora = MENSAL, maximoCobrancasMora = 3:
     *   Cobra no máximo 3 vezes, uma vez por mês.
     *   Após o 3º mês, não cobra mais mora.
     */
    Integer maximoCobrancasMora = 0

    // =========================================================================
    // CONFIGURAÇÕES DE DIAS ÚTEIS E FINS DE SEMANA
    // =========================================================================

    Boolean excluirSabados = false
    Boolean excluirDomingos = true
    Boolean excluirDiaDePagNoSabado = true
    Boolean excluirDiaDePagNoDomingo = true

    // =========================================================================
    // CONTROLE E AUDITORIA
    // =========================================================================

    Boolean ativo = true
    Date dateCreated
    Date lastUpdated

    // =========================================================================
    // CONSTRAINTS (Validações)
    // =========================================================================

    static constraints = {
        nome nullable: false, blank: false, maxSize: 100, unique: true
        descricao nullable: true, maxSize: 500

        numeroDePrestacoes nullable: false, min: 1, max: 360
        periodicidade nullable: false
        formaDeCalculo nullable: false

        percentualDeJuros nullable: false, min: 0.0G, max: 999.9999G, scale: 4
        percentualJurosDeDemora nullable: false, min: 0.0G, max: 100.0G, scale: 4

        taxa nullable: true

        periodicidadeMora nullable: true,
                validator: { PeriodicidadeMora val, DefinicaoCredito obj ->
                    if (obj.maximoCobrancasMora > 0 && !val) {
                        return ['definicaoCredito.periodicidadeMora.obrigatorio']
                    }
                    return true
                }

        maximoCobrancasMora nullable: false, min: 0, max: 100

        excluirSabados nullable: false
        excluirDomingos nullable: false
        excluirDiaDePagNoSabado nullable: false
        excluirDiaDePagNoDomingo nullable: false

        ativo nullable: false
    }

    // =========================================================================
    // MAPPING (Mapeamento para o banco)
    // =========================================================================

    static mapping = {
        table 'definicoes_credito'
        sort nome: 'asc'

        // Mapeamento explícito de todas as colunas compostas
        numeroDePrestacoes column: 'numero_de_prestacoes'
        formaDeCalculo column: 'forma_de_calculo'
        percentualDeJuros column: 'percentual_de_juros'
        percentualJurosDeDemora column: 'percentual_juros_de_demora'
        periodicidadeMora column: 'periodicidade_mora'
        maximoCobrancasMora column: 'maximo_cobrancas_mora'
        excluirSabados column: 'excluir_sabados'
        excluirDomingos column: 'excluir_domingos'
        excluirDiaDePagNoSabado column: 'excluir_dia_de_pag_no_sabado'
        excluirDiaDePagNoDomingo column: 'excluir_dia_de_pag_no_domingo'

        dateCreated column: 'data_criacao'
        lastUpdated column: 'data_atualizacao'

        taxa column: 'taxa_id', fetch: 'join'
        ativo index: 'idx_definicoes_credito_ativo'
    }

    // =========================================================================
    // MÉTODOS AUXILIARES
    // =========================================================================

    String toString() {
        "${nome} - ${numeroDePrestacoes}x ${periodicidade?.descricao}"
    }

    String getDescricaoCompleta() {
        "${nome} (${numeroDePrestacoes} prestações ${periodicidade?.descricao?.toLowerCase()})"
    }

    Integer getDiasEntrePrestacoes() {
        periodicidade?.dias ?: 30
    }

    /**
     * Verifica se cobra mora
     */
    boolean isCobraMora() {
        maximoCobrancasMora > 0 && percentualJurosDeDemora > 0
    }

    /**
     * Retorna um resumo da configuração de mora
     */
    String getResumoMora() {
        if (!isCobraMora()) {
            return "Não cobra mora"
        }
        if (maximoCobrancasMora == 1) {
            return "Cobra 1 vez (${periodicidadeMora?.descricao?.toLowerCase()}) - ${percentualJurosDeDemora}%"
        }
        return "Até ${maximoCobrancasMora}x ${periodicidadeMora?.descricao?.toLowerCase()} - ${percentualJurosDeDemora}%"
    }

    /**
     * Retorna um resumo das exclusões de dias
     */
    String getResumoExclusoes() {
        def exclusoes = []
        if (excluirSabados) exclusoes << "Sábados"
        if (excluirDomingos) exclusoes << "Domingos"
        exclusoes.isEmpty() ? "Nenhuma" : exclusoes.join(", ")
    }

    def beforeValidate() {
        nome = nome?.trim()
        descricao = descricao?.trim()

        if (maximoCobrancasMora == null) {
            maximoCobrancasMora = 0
        }
        if (maximoCobrancasMora == 0) {
            periodicidadeMora = null
        }
        if (percentualDeJuros == null) {
            percentualDeJuros = 0.0G
        }
        if (percentualJurosDeDemora == null) {
            percentualJurosDeDemora = 0.00G
        }
    }
}

// =========================================================================
// ENUMS DECLARADOS FORA DA CLASSE
// =========================================================================

enum Periodicidade {
    DIARIO('Diário', 1),
    SEMANAL('Semanal', 7),
    QUINZENAL('Quinzenal', 15),
    MENSAL('Mensal', 30)

    final String descricao
    final int dias

    Periodicidade(String descricao, int dias) {
        this.descricao = descricao
        this.dias = dias
    }

    String toString() { descricao }
}

enum FormaCalculo {
    TAXA_FIXA('Taxa Fixa'),
    PMT('PMT - Prestações Fixas'),
    SAC('SAC - Amortização Constante'),
    JUROS_SIMPLES('Juros Simples'),
    JUROS_COMPOSTOS('Juros Compostos')

    final String descricao

    FormaCalculo(String descricao) {
        this.descricao = descricao
    }

    String toString() { descricao }
}

enum PeriodicidadeMora {
    DIARIO('Diário', 1),
    SEMANAL('Semanal', 7),
    QUINZENAL('Quinzenal', 15),
    MENSAL('Mensal', 30)

    final String descricao
    final int dias

    PeriodicidadeMora(String descricao, int dias) {
        this.descricao = descricao
        this.dias = dias
    }

    String toString() { descricao }
}