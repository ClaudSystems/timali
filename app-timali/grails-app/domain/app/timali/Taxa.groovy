// grails-app/domain/app/timali/Taxa.groovy
package app.timali

import grails.compiler.GrailsCompileStatic
import grails.rest.Resource

/**
 * Classe de domínio que representa a definição/configuração de uma taxa.
 *
 * Esta classe serve como um "molde" ou "regra de negócio" que define COMO uma taxa
 * deve ser calculada. O cálculo efetivo será executado posteriormente no momento
 * da criação do crédito, utilizando os parâmetros aqui definidos.
 *
 * @Resource - Transforma esta classe em um Recurso RESTful completo
 *   - uri: '/api/taxas'    => Endpoint base da API
 *   - formats: ['json']    => Formato de resposta
 *   - readOnly: false      => Permite operações de escrita (POST, PUT, PATCH, DELETE)
 *
 * Exemplos de uso:
 * - Taxa de 3% sobre o valor do crédito
 * - Taxa fixa de 200 MT por operação
 * - Taxa escalonada: 5% até 10.000 MT, 2% acima de 10.000 MT
 *
 * @author Seu Nome
 * @since 2024
 */
@GrailsCompileStatic
@Resource(uri = '/api/taxas', formats = ['json'], readOnly = false)
class Taxa {

    // =========================================================================
    // IDENTIFICAÇÃO DA TAXA
    // =========================================================================

    /**
     * Nome único que identifica a taxa no sistema.
     * Exemplos: "IOF", "TARIFA_ABERTURA", "TAXA_VOLUME", "SEGURO_PRESTAMISTA"
     */
    String nome

    /**
     * Descrição detalhada da finalidade da taxa.
     * Exemplo: "Taxa de abertura de crédito cobrada no ato da contratação"
     */
    String descricao

    // =========================================================================
    // TIPO DE CÁLCULO - Define a estratégia/forma de cálculo da taxa
    // =========================================================================

    /**
     * Define o tipo de cálculo que será aplicado a esta taxa.
     * Este campo determina quais dos campos de valor serão utilizados no cálculo.
     */
    TipoCalculo tipoCalculo

    /**
     * Enumeração interna que define os tipos de cálculo suportados pelo sistema.
     */
    static enum TipoCalculo {
        PERCENTUAL,      // Cálculo: valorBase * (percentual / 100)
        VALOR_FIXO,      // Cálculo: valorFixo (constante)
        FAIXA_PERCENTUAL // Cálculo: valorBase * (percentual da faixa aplicável / 100)
    }

    // =========================================================================
    // CAMPOS PARA TAXAS SIMPLES (Percentual ou Valor Fixo)
    // =========================================================================

    /**
     * Valor percentual da taxa (utilizado quando tipoCalculo = PERCENTUAL).
     * Exemplos: 3.00 = 3%, 0.50 = 0,5%, 10.75 = 10,75%
     */
    BigDecimal percentual

    /**
     * Valor monetário fixo da taxa (utilizado quando tipoCalculo = VALOR_FIXO).
     * Exemplos: 200.00 = 200,00 MT, 50.50 = 50,50 MT
     */
    BigDecimal valorFixo

    // =========================================================================
    // CAMPOS PARA TAXAS ESCALONADAS (Múltiplas faixas)
    // =========================================================================

    /**
     * Representação em JSON das faixas de valor e seus respectivos percentuais.
     * Utilizado quando tipoCalculo = FAIXA_PERCENTUAL.
     *
     * Formato: [{"min":0,"max":10000,"perc":5},{"min":10000.01,"perc":2}]
     */
    String faixasJson

    // =========================================================================
    // LIMITES DA TAXA (Aplicáveis a qualquer tipo de cálculo)
    // =========================================================================

    /**
     * Valor mínimo que a taxa pode resultar após o cálculo (piso).
     */
    BigDecimal valorMinimo

    /**
     * Valor máximo que a taxa pode resultar após o cálculo (teto).
     */
    BigDecimal valorMaximo

    // =========================================================================
    // CONTROLE E AUDITORIA
    // =========================================================================

    /**
     * Indica se a taxa está ativa e disponível para uso no sistema.
     */
    Boolean ativo = true

    /**
     * Data e hora em que o registro da taxa foi criado no sistema.
     */
    Date dateCreated

    /**
     * Data e hora da última modificação do registro da taxa.
     */
    Date lastUpdated

    // =========================================================================
    // CONSTRAINTS (Regras de Validação)
    // =========================================================================

    static constraints = {
        nome nullable: false, blank: false, unique: true

        descricao nullable: true, maxSize: 500

        tipoCalculo nullable: false

        percentual nullable: true, min: 0.0G, max: 100.0G, scale: 4,
                validator: { BigDecimal val, Taxa obj ->
                    if (obj.tipoCalculo == TipoCalculo.PERCENTUAL && val == null) {
                        return ['taxa.percentual.obrigatorio']
                    }
                }

        valorFixo nullable: true, min: 0.0G, scale: 2,
                validator: { BigDecimal val, Taxa obj ->
                    if (obj.tipoCalculo == TipoCalculo.VALOR_FIXO && val == null) {
                        return ['taxa.valorFixo.obrigatorio']
                    }
                }

        faixasJson nullable: true, maxSize: 2000,
                validator: { String val, Taxa obj ->
                    if (obj.tipoCalculo == TipoCalculo.FAIXA_PERCENTUAL && !val) {
                        return ['taxa.faixasJson.obrigatorio']
                    }
                }

        valorMinimo nullable: true, min: 0.0G, scale: 2

        valorMaximo nullable: true, min: 0.0G, scale: 2,
                validator: { BigDecimal val, Taxa obj ->
                    if (val != null && obj.valorMinimo != null && val <= obj.valorMinimo) {
                        return ['taxa.valorMaximo.invalido']
                    }
                }
    }

    // =========================================================================
    // MAPPING (Mapeamento Objeto-Relacional)
    // =========================================================================

    static mapping = {
        table 'taxas'
        sort nome: 'asc'
        dateCreated column: 'data_criacao'
        lastUpdated column: 'data_atualizacao'
    }

    // =========================================================================
    // MÉTODOS AUXILIARES
    // =========================================================================

    /**
     * Representação textual da taxa para facilitar identificação.
     */
    String toString() {
        "${nome} - ${tipoCalculo}"
    }

    /**
     * Retorna uma descrição resumida de como a taxa está configurada.
     */
    String getConfiguracaoResumida() {
        switch (tipoCalculo) {
            case TipoCalculo.PERCENTUAL:
                return "${percentual}% do valor"
            case TipoCalculo.VALOR_FIXO:
                return "${valorFixo} MT (fixo)"
            case TipoCalculo.FAIXA_PERCENTUAL:
                return "Faixas configuradas (${contarFaixas()} faixas)"
            default:
                return "Não configurada"
        }
    }

    /**
     * Método auxiliar privado para contar quantas faixas existem no JSON.
     */

    private int contarFaixas() {
        if (!faixasJson) return 0
        try {
            def parsed = grails.converters.JSON.parse(faixasJson)
            if (parsed instanceof List) {
                return ((List) parsed).size()
            }
            return 0
        } catch (Exception e) {
            return 0
        }
    }

    /**
     * Método chamado automaticamente antes de validar.
     * Garante consistência dos dados recebidos via API.
     */
    def beforeValidate() {
        nome = nome?.toUpperCase()?.trim()
    }
}