package app.timali

import grails.gorm.transactions.Transactional

@Transactional
class ContactoService {

    Contacto get(Long id) {
        return Contacto.get(id)
    }

    /**
     * Cria um novo contacto vinculado obrigatoriamente a uma Entidade.
     */
    Contacto criar(Entidade entidade, Map data) {

        // 1. Buscar entidade fresca do banco
        Entidade entidadePersistida = Entidade.get(entidade.id)

        // 2. Criar identificacao
        Contacto con = new Contacto()
        aplicarDados(con, data)

        // 3. Atribuir nos DOIS lados
        con.entidade = entidadePersistida
        entidadePersistida.contacto = con

        // 4. Salvar a ENTIDADE (não a identificacao)
        entidadePersistida.save(flush: true, failOnError: true)

        return con

    }

    /**
     * Atualiza o contacto da entidade. Se não existir, cria um.
     */
    Contacto atualizar(Entidade entidade, Map data) {
        // Busca o contacto vinculado a esta entidade específica
        Contacto cont = Contacto.findByEntidade(entidade)

        if (!cont) {
            return criar(entidade, data)
        }

        aplicarDados(cont, data)
        cont.save(flush: true, failOnError: true)
        return cont
    }

    void deletar(Long id) {
        Contacto cont = Contacto.get(id)
        if (cont) {
            cont.delete(flush: true)
        }
    }

    void deletarPorEntidade(Entidade entidade) {
        Contacto cont = Contacto.findByEntidade(entidade)
        if (cont) {
            cont.delete(flush: true)
        }
    }

    /**
     * Centraliza a lógica de atribuição de campos para evitar repetição.
     */
    private void aplicarDados(Contacto cont, Map data) {
        if (data.telefone != null) cont.telefone = data.telefone
        if (data.telefone1 != null) cont.telefone1 = data.telefone1
        if (data.telefone2 != null) cont.telefone2 = data.telefone2
        if (data.email != null) cont.email = data.email
        if (data.residencia != null) cont.residencia = data.residencia
        if (data.nacionalidade != null) cont.nacionalidade = data.nacionalidade
        if (data.profissao != null) cont.profissao = data.profissao
        if (data.localDeTrabalho != null) cont.localDeTrabalho = data.localDeTrabalho
    }

    // --- Verificações de Unicidade ---

    boolean existePorEmail(String email) {
        if (!email) return false
        return Contacto.countByEmail(email) > 0
    }

    boolean existePorTelefone(String telefone) {
        if (!telefone) return false
        // Verifica nos três campos de telefone possíveis
        return Contacto.createCriteria().get {
            or {
                eq('telefone', telefone)
                eq('telefone1', telefone)
                eq('telefone2', telefone)
            }
            projections { count() }
        } > 0
    }

    /**
     * Formatação para retorno JSON.
     */
    Map formatarParaJson(Contacto cont) {
        if (!cont) return null

        return [
                id: cont.id,
                telefone: cont.telefone,
                telefone1: cont.telefone1,
                telefone2: cont.telefone2,
                email: cont.email,
                residencia: cont.residencia,
                nacionalidade: cont.nacionalidade,
                profissao: cont.profissao,
                localDeTrabalho: cont.localDeTrabalho,
                version: cont.version
        ]
    }
}