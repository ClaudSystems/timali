// grails-app/domain/app/timali/DadosPessoais.groovy
package app.timali

class DadosPessoais {

    Date dataDeNascimento
    Genero genero
    EstadoCivil estadoCivil

    static belongsTo = [entidade: Entidade]

    static constraints = {
        dataDeNascimento nullable: true
        genero nullable: true
        estadoCivil nullable: true
    }

    static mapping = {
        table 'dados_pessoais'
        genero enumType: "string"
        estadoCivil enumType: "string"
        entidade column: 'entidade_id', index: 'idx_dados_pessoais_entidade'
    }
}