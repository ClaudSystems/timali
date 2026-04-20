package app.timali

import grails.rest.*

enum TipoDePessoa {
    CLIENTE,
    ASSINANTE,
    FORNECEDOR,
    FUNCIONARIO
}

@Resource(uri='/api/entidades', formats=['json', 'xml'])
class Entidade {
    
    String codigo
    String nome
    TipoDePessoa tipoDePessoa
    
    Boolean ativo = true
    String classificacao
    Date dataDeEmissao
    Date dataDeValidade
    Date dataDeNascimento
    Boolean emDivida = false
    String email
    String estadoCivil 
    String genero
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
    
    String tipoDeIdentificao

    static constraints = {
        codigo nullable: false, unique: true
        nome nullable: false, blank: false
        tipoDePessoa nullable: false
        
        classificacao nullable: true
        dataDeEmissao nullable: true
        dataDeValidade nullable: true
        dataDeNascimento nullable: true
        email nullable: true, email: true
        estadoCivil nullable: true
        genero nullable: true
        localDeTrabalho nullable: true
        nacionalidade nullable: true
        arquivoDeIdentificao nullable: true
        nuit nullable: true
        numeroDeIdentificao nullable: true
        profissao nullable: true
        residencia nullable: true
        telefone nullable: true
        telefone1 nullable: true
        telefone2 nullable: true
        tipoDeIdentificao nullable: true
    }

    static mapping = {
        tipoDePessoa enumType: "string"
    }
}
