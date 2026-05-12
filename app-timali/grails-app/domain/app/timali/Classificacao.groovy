// grails-app/domain/app/timali/Classificacao.groovy
package app.timali

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