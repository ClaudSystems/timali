// grails-app/domain/app/timali/TipoDeIdentificacao.groovy
package app.timali

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