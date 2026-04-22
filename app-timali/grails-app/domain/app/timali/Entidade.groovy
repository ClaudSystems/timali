package app.timali

import grails.rest.*

enum TipoDePessoa {
    CLIENTE,
    ASSINANTE,
    FORNECEDOR,
    FUNCIONARIO
}

enum TipoDeIdentificacao {
    BI("Bilhete de Identidade"),
    PASSAPORTE("Passaporte"),
    CEDULA("Cédula Pessoal"),
    CARTAO_ELEITOR("Cartão de Eleitor"),
    DIRE("DIRE"),
    NUIT("NUIT"),
    OUTRO("Outro")

    String descricao

    TipoDeIdentificacao(String descricao) {
        this.descricao = descricao
    }

    String toString() { descricao }
    String getKey() { name() }
}

enum EstadoCivil {
    SOLTEIRO("Solteiro(a)"),
    CASADO("Casado(a)"),
    DIVORCIADO("Divorciado(a)"),
    VIUVO("Viúvo(a)"),
    UNIAO_ESTAVEL("União Estável"),
    SEPARADO("Separado(a)")

    String descricao

    EstadoCivil(String descricao) {
        this.descricao = descricao
    }

    String toString() { descricao }
}

enum Genero {
    MASCULINO("Masculino"),
    FEMININO("Feminino"),
    OUTRO("Outro"),
    PREFIRO_NAO_DIZER("Prefiro não dizer")

    String descricao

    Genero(String descricao) {
        this.descricao = descricao
    }

    String toString() { descricao }
}

enum Classificacao {
    NAO_CLASSIFICADO("Não Classificado"),
    MAU("Mau"),
    REGULAR("Regular"),
    BOM("Bom"),
    MUITO_BOM("Muito Bom"),
    EXCELENTE("Excelente"),
    VIP("VIP"),
    PREMIUM("Premium")

    String descricao

    Classificacao(String descricao) {
        this.descricao = descricao
    }

    String toString() { descricao }
    String getKey() { name() }
}


@Resource(uri='/api/entidades', formats=['json'], readOnly = false)  // readOnly = false é CRÍTICO!
class Entidade {

    String codigo
    String nome
    TipoDePessoa tipoDePessoa

    Boolean ativo = true
    Classificacao classificacao
    Date dataDeEmissao
    Date dataDeValidade
    Date dataDeNascimento
    Boolean emDivida = false
    String email
    EstadoCivil estadoCivil
    Genero genero
    String localDeTrabalho
    String nacionalidade
    String arquivoDeIdentificao
    String nuit
    String numeroDeIdentificao
    String profissao
    String residencia

    String telefone
    String telefone1
    String telefone2

    TipoDeIdentificacao tipoDeIdentificao

    static constraints = {
        codigo nullable: true, unique: true, maxSize: 6
        nome nullable: false, blank: false, maxSize: 255
        tipoDePessoa nullable: false

        classificacao nullable: true
        dataDeEmissao nullable: true
        dataDeValidade nullable: true
        dataDeNascimento nullable: true
        email nullable: true, email: true, maxSize: 255
        estadoCivil nullable: true
        genero nullable: true
        localDeTrabalho nullable: true, maxSize: 255
        nacionalidade nullable: true, maxSize: 100
        arquivoDeIdentificao nullable: true, maxSize: 500
        nuit nullable: true, maxSize: 20
        numeroDeIdentificao nullable: true, maxSize: 50
        profissao nullable: true, maxSize: 100
        residencia nullable: true, maxSize: 500
        telefone nullable: true, maxSize: 20
        telefone1 nullable: true, maxSize: 20
        telefone2 nullable: true, maxSize: 20
        tipoDeIdentificao nullable: true
    }

    static mapping = {
        tipoDePessoa enumType: "string"
        tipoDeIdentificao enumType: "string"
        estadoCivil enumType: "string"
        genero enumType: "string"
        classificacao enumType: "string"
        codigo index: 'idx_entidade_codigo'
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
        def ultimaEntidade = Entidade.createCriteria().get {
            projections { max "codigo" }
        }

        if (ultimaEntidade) {
            try {
                int ultimoCodigo = Integer.parseInt(ultimaEntidade)
                String novoCodigo = String.valueOf(ultimoCodigo + 1)
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