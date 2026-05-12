// grails-app/domain/app/timali/Genero.groovy
package app.timali

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