// grails-app/domain/app/timali/Feriado.groovy
package app.timali

import grails.compiler.GrailsCompileStatic
import grails.rest.Resource
import groovy.transform.TypeCheckingMode

/**
 * Classe de domínio que representa um feriado.
 *
 * Os feriados cadastrados serão utilizados para ajustar automaticamente
 * as datas de pagamento das prestações, evitando que caiam em dias não úteis.
 *
 * @Resource - API REST automática
 *   - uri: '/api/feriados' => Endpoint base
 *   - formats: ['json']    => Resposta em JSON
 *   - readOnly: false      => Permite todas as operações CRUD
 */
@GrailsCompileStatic
@Resource(uri = '/api/feriados', formats = ['json'], readOnly = false)
class Feriado {

    // =========================================================================
    // IDENTIFICAÇÃO DO FERIADO
    // =========================================================================

    /**
     * Nome do feriado.
     * Exemplos: "Dia da Independência", "Natal", "Ano Novo"
     */
    String nome

    /**
     * Descrição opcional do feriado.
     * Exemplo: "Feriado nacional - Independência de Moçambique"
     */
    String descricao

    // =========================================================================
    // DATA DO FERIADO
    // =========================================================================

    /**
     * Data do feriado (dia/mês - sem ano, para feriados fixos).
     * Formato: MM-dd (Ex: 06-25 para 25 de Junho)
     * Se null, usa dataCompleta
     */
    String dataFixa

    /**
     * Data completa do feriado (com ano, para feriados móveis ou específicos).
     * Exemplos: "2024-04-07" (Páscoa), "2024-05-01" (Dia do Trabalhador)
     * Se null, usa dataFixa para todos os anos
     */
    Date dataCompleta

    /**
     * Ano de referência (opcional, para feriados que só valem em anos específicos).
     * Exemplo: 2024 (feriado excepcional decretado apenas para este ano)
     */
    Integer ano

    // =========================================================================
    // ABRANGÊNCIA DO FERIADO
    // =========================================================================

    /**
     * Tipo de abrangência do feriado.
     * - NACIONAL: Aplica-se a todo o país
     * - PROVINCIAL: Aplica-se apenas a uma província específica
     * - MUNICIPAL: Aplica-se apenas a um município específico
     */
    TipoAbrangencia abrangencia

    /**
     * Localidade específica (nome da província ou município).
     * Preenchido apenas quando abrangencia não for NACIONAL.
     * Exemplos: "Maputo", "Sofala", "Cidade de Maputo"
     */
    String localidade

    // =========================================================================
    // TIPO DO FERIADO
    // =========================================================================

    /**
     * Tipo do feriado.
     * - FIXO: Acontece sempre na mesma data todos os anos (ex: 25 de Junho)
     * - MOVEL: Data varia a cada ano (ex: Páscoa, Carnaval)
     * - PONTE: Feriado decretado como "ponte" entre feriado e fim de semana
     * - EXCEPCIONAL: Feriado decretado apenas para um ano específico
     */
    TipoFeriado tipo

    // =========================================================================
    // CONTROLE E AUDITORIA
    // =========================================================================

    /**
     * Indica se o feriado está ativo.
     * Feriados inativos são ignorados nos cálculos.
     */
    Boolean ativo = true

    /**
     * Data de criação do registro
     */
    Date dateCreated

    /**
     * Data da última atualização
     */
    Date lastUpdated

    // =========================================================================
    // CONSTRAINTS (Validações)
    // =========================================================================

    static constraints = {
        nome nullable: false, blank: false, maxSize: 100

        descricao nullable: true, maxSize: 500

        dataFixa nullable: true, maxSize: 5, matches: '\\d{2}-\\d{2}',
                validator: { String val, Feriado obj ->
                    if (obj.tipo == TipoFeriado.FIXO && !val) {
                        return ['feriado.dataFixa.obrigatorio']
                    }
                    if (val) {
                        try {
                            def parts = val.split('-')
                            def mes = parts[0].toInteger()
                            def dia = parts[1].toInteger()
                            if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
                                return ['feriado.dataFixa.invalida']
                            }
                        } catch (Exception e) {
                            return ['feriado.dataFixa.formato']
                        }
                    }
                    return true
                }

        dataCompleta nullable: true,
                validator: { Date val, Feriado obj ->
                    if (obj.tipo in [TipoFeriado.MOVEL, TipoFeriado.EXCEPCIONAL, TipoFeriado.PONTE] && !val) {
                        return ['feriado.dataCompleta.obrigatorio']
                    }
                    return true
                }

        ano nullable: true, min: 2020, max: 2100,
                validator: { Integer val, Feriado obj ->
                    if (obj.tipo == TipoFeriado.EXCEPCIONAL && !val) {
                        return ['feriado.ano.obrigatorio']
                    }
                    return true
                }

        abrangencia nullable: false

        // CORRIGIDO: Validação da localidade - SÓ exige se NÃO for NACIONAL
        localidade nullable: true, maxSize: 100,
                validator: { String val, Feriado obj ->
                    // Obtém o valor da abrangência como String
                    def abrangenciaStr = obj.abrangencia?.toString()

                    // Se for NACIONAL, localidade NÃO é obrigatória
                    if (abrangenciaStr == 'NACIONAL') {
                        return true
                    }

                    // Para outros tipos (PROVINCIAL, MUNICIPAL), localidade É obrigatória
                    if (!val || val.trim().isEmpty()) {
                        return ['feriado.localidade.obrigatorio']
                    }

                    return true
                }

        tipo nullable: false

        ativo nullable: false
    }

    // =========================================================================
    // MAPPING (Mapeamento para o banco)
    // =========================================================================

    static mapping = {
        table 'feriados'
        sort nome: 'asc'
        dateCreated column: 'data_criacao'
        lastUpdated column: 'data_atualizacao'

        // Índices para melhor performance
        dataCompleta index: 'idx_feriados_data'
        ano index: 'idx_feriados_ano'
        ativo index: 'idx_feriados_ativo'
    }

    // =========================================================================
    // MÉTODOS AUXILIARES
    // =========================================================================

    /**
     * Representação textual do feriado
     */
    String toString() {
        "${nome} - ${getDataFormatada()}"
    }

    /**
     * Retorna a data formatada para exibição
     */
    @groovy.transform.CompileStatic(TypeCheckingMode.SKIP)
    String getDataFormatada() {
        if (dataCompleta) {
            return dataCompleta.format('dd/MM/yyyy')
        }
        if (dataFixa) {
            def parts = dataFixa.split('-')
            return "${parts[1]}/${parts[0]}"
        }
        return "Data não definida"
    }

    /**
     * Verifica se o feriado se aplica a uma data específica
     */
    @groovy.transform.CompileStatic(TypeCheckingMode.SKIP)
    boolean aplicaParaData(Date data) {
        if (!ativo) return false

        Calendar cal = Calendar.getInstance()
        cal.time = data

        if (ano && cal.get(Calendar.YEAR) != ano) {
            return false
        }

        if (dataCompleta) {
            Calendar cal1 = Calendar.getInstance()
            cal1.time = dataCompleta
            Calendar cal2 = Calendar.getInstance()
            cal2.time = data

            return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
                    cal1.get(Calendar.MONTH) == cal2.get(Calendar.MONTH) &&
                    cal1.get(Calendar.DAY_OF_MONTH) == cal2.get(Calendar.DAY_OF_MONTH)
        }

        if (dataFixa) {
            def parts = dataFixa.split('-')
            def mes = parts[0].toInteger()
            def dia = parts[1].toInteger()

            return cal.get(Calendar.MONTH) + 1 == mes &&
                    cal.get(Calendar.DAY_OF_MONTH) == dia
        }

        return false
    }

    /**
     * Retorna a data deste feriado em um ano específico
     */
    @groovy.transform.CompileStatic(TypeCheckingMode.SKIP)
    Date getDataNoAno(int anoReferencia) {
        if (ano && ano != anoReferencia) {
            return null
        }

        if (dataCompleta) {
            return dataCompleta
        }

        if (dataFixa) {
            def parts = dataFixa.split('-')
            def mes = parts[0].toInteger()
            def dia = parts[1].toInteger()

            Calendar cal = Calendar.getInstance()
            cal.set(anoReferencia, mes - 1, dia, 0, 0, 0)
            cal.set(Calendar.MILLISECOND, 0)
            return cal.time
        }

        return null
    }

    /**
     * Retorna o nome da abrangência formatado
     */
    String getAbrangenciaFormatada() {
        if (abrangencia == TipoAbrangencia.NACIONAL) {
            return "Nacional"
        }
        return "${abrangencia?.descricao} - ${localidade}"
    }

    // =========================================================================
    // CICLO DE VIDA GORM
    // =========================================================================

    /**
     * Antes de inserir no banco - LOG PARA DEBUG
     */
    def beforeInsert() {
        println ">>> beforeInsert: nome=${nome}, tipo=${tipo}, abrangencia=${abrangencia}, dataFixa=${dataFixa}"
    }

    /**
     * Antes de validar - garante consistência dos dados
     */
    def beforeValidate() {
        nome = nome?.trim()

        if (tipo instanceof String) {
            try {
                tipo = TipoFeriado.valueOf(tipo.trim().toUpperCase())
            } catch (Exception e) {
                println ">>> ERRO ao converter tipo: ${e.message}"
            }
        }

        if (abrangencia instanceof String) {
            try {
                abrangencia = TipoAbrangencia.valueOf(abrangencia.trim().toUpperCase())
            } catch (Exception e) {
                println ">>> ERRO ao converter abrangencia: ${e.message}"
                abrangencia = TipoAbrangencia.NACIONAL
            }
        }

        if (abrangencia?.name() == 'NACIONAL') {
            localidade = null
        } else if (localidade) {
            localidade = localidade.trim()
        }
    }

}

// =========================================================================
// ENUMS DECLARADOS FORA DA CLASSE
// =========================================================================

enum TipoAbrangencia {
    NACIONAL('Nacional'),
    PROVINCIAL('Provincial'),
    MUNICIPAL('Municipal')

    final String descricao

    TipoAbrangencia(String descricao) {
        this.descricao = descricao
    }

    String toString() { name() }  // ← CORRIGIDO: retorna "NACIONAL" em vez de "Nacional"

    String getDescricao() { descricao }  // ← ADICIONADO: método separado para descrição
}

enum TipoFeriado {
    FIXO('Fixo - Mesma data todos os anos'),
    MOVEL('Móvel - Data varia anualmente'),
    PONTE('Ponte - Entre feriado e fim de semana'),
    EXCEPCIONAL('Excepcional - Apenas em ano específico')

    final String descricao

    TipoFeriado(String descricao) {
        this.descricao = descricao
    }

    String toString() { name() }  // ← CORRIGIDO: retorna "FIXO" em vez da descrição

    String getDescricao() { descricao }  // ← ADICIONADO
}