// grails-app/domain/app/timali/EstadoCivil.groovy
package app.timali

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