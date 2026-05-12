package app.timali

class Identificacao {

    TipoDeIdentificacao tipoDeIdentificao
    String numeroDeIdentificao
    String nuit
    String arquivoDeIdentificao
    Date dataDeEmissao
    Date dataDeValidade

    static belongsTo = [entidade: Entidade]

    static constraints = {
        tipoDeIdentificao nullable: true
        numeroDeIdentificao nullable: true, maxSize: 50
        nuit nullable: true, maxSize: 20
        arquivoDeIdentificao nullable: true, maxSize: 500
        dataDeEmissao nullable: true
        dataDeValidade nullable: true
    }

    static mapping = {
        table 'identificacao'
        tipoDeIdentificao enumType: "string"
        entidade column: 'entidade_id', index: 'idx_identificacao_entidade'
    }

    // 👇 CORRIGIDO - Use createCriteria ou where
    static Identificacao findByNumeroDeIdentificao(String numero) {
        if (!numero) return null
        return findWhere(numeroDeIdentificao: numero)
    }

    static Identificacao findByNuit(String nuit) {
        if (!nuit) return null
        return findWhere(nuit: nuit)
    }
}