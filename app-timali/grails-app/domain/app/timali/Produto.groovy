package app.timali

class Produto {
    String nome
    BigDecimal preco
    Integer estoque

    static constraints = {
        nome blank: false, maxSize: 255
        preco nullable: false, scale: 2
        estoque nullable: true, min: 0
    }

    @Override
    String toString() {
        return "Produto: ${nome}"
    }
}
