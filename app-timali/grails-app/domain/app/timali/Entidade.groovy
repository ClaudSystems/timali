// grails-app/domain/app/timali/Entidade.groovy
package app.timali

class Entidade {

    String codigo
    String nome
    TipoDePessoa tipoDePessoa
    Boolean ativo = true
    Classificacao classificacao
    Boolean emDivida = false
    Usuario usuario

    static hasMany = [documentos: Documento]
    static hasOne = [identificacao: Identificacao, contacto: Contacto, dadosPessoais: DadosPessoais]


    static constraints = {
        codigo nullable: true, unique: true, maxSize: 6
        nome nullable: false, blank: false, maxSize: 255
        tipoDePessoa nullable: false
        usuario nullable: true
        classificacao nullable: true
        identificacao nullable: true
        contacto nullable: true
        dadosPessoais nullable: true
    }

    static mapping = {
        tipoDePessoa enumType: "string"
        classificacao enumType: "string"
        codigo index: 'idx_entidade_codigo'
        identificacao column: 'identificacao_id'
        contacto column: 'contacto_id'
        dadosPessoais column: 'dados_pessoais_id'
    }

    String toString() {
        "${codigo} - ${nome}"
    }

    def beforeInsert() {
        if (!codigo) {
            codigo = gerarCodigoUnico()
        }
        emDivida = false
        if (!classificacao) {
            classificacao = Classificacao.NAO_CLASSIFICADO
        }
    }

    def beforeUpdate() {
        emDivida = emDivida ?: false
    }

    def gerarCodigoUnico() {
        String novoCodigo
        int maxTentativas = 1000

        for (int i = 0; i < maxTentativas; i++) {
            novoCodigo = gerarCodigoAleatorio()
            if (!codigoExiste(novoCodigo)) {
                return novoCodigo
            }
        }
        return gerarCodigoSequencial()
    }

    private boolean codigoExiste(String codigo) {
        Entidade.where { codigo == codigo }.count() > 0
    }

    private String gerarCodigoAleatorio() {
        Random random = new Random()
        int numero = random.nextInt(900000) + 100000
        return String.valueOf(numero)
    }

    private String gerarCodigoSequencial() {
        def resultado = Entidade.createCriteria().get {
            projections { max "codigo" }
        }

        String ultimoCodigo = resultado instanceof List ? resultado[0] : resultado?.toString()

        if (ultimoCodigo && ultimoCodigo.isNumber()) {
            try {
                int ultimoNumero = Integer.parseInt(ultimoCodigo)
                String novoCodigo = String.valueOf(ultimoNumero + 1)
                if (!codigoExiste(novoCodigo)) {
                    return novoCodigo
                }
            } catch (NumberFormatException e) {}
        }

        String timestampCode = String.valueOf(System.currentTimeMillis()).substring(7, 13)
        return timestampCode
    }

    static boolean isCodigoDisponivel(String codigo) {
        if (!codigo) return false
        !Entidade.where { codigo == codigo }.exists()
    }
}