package app.timali

class BootStrap {

    def init = { servletContext ->
        Produto.withTransaction {
            if (Produto.count() == 0) {
                new Produto(nome: "Smartphone Samsung Galaxy", preco: 2500.00, estoque: 10).save(flush: true)
                new Produto(nome: "Notebook Dell Inspiron", preco: 4500.50, estoque: 5).save(flush: true)
                new Produto(nome: "Monitor LG 24'", preco: 850.00, estoque: 15).save(flush: true)
                new Produto(nome: "Teclado Mecânico RGB", preco: 350.00, estoque: 20).save(flush: true)
                println ">>> Dados iniciais inseridos com sucesso!"
            }
        }
    }
    def destroy = {
    }
}
