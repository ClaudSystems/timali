package app.timali

class Contacto {

    String telefone
    String telefone1
    String telefone2
    String email
    String residencia
    String nacionalidade
    String profissao
    String localDeTrabalho

    static belongsTo = [entidade: Entidade]

    static constraints = {
        telefone nullable: true, maxSize: 20
        telefone1 nullable: true, maxSize: 20
        telefone2 nullable: true, maxSize: 20
        email nullable: true, email: true, maxSize: 255
        residencia nullable: true, maxSize: 500
        nacionalidade nullable: true, maxSize: 100
        profissao nullable: true, maxSize: 100
        localDeTrabalho nullable: true, maxSize: 255
    }

    static mapping = {
        table 'contacto'
        entidade column: 'entidade_id', index: 'idx_contacto_entidade'
    }

    // 👇 CORRIGIDO
    static Contacto findByEmail(String email) {
        if (!email) return null
        return findWhere(email: email)
    }

    static Contacto findByTelefone(String telefone) {
        if (!telefone) return null
        return findWhere(telefone: telefone) ?: findWhere(telefone1: telefone) ?: findWhere(telefone2: telefone)
    }
}