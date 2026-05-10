// grails-app/services/app/timali/EntidadeService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import grails.converters.JSON

@Transactional
class EntidadeService {

    Entidade get(Long id) {
        return Entidade.get(id)
    }

    List<Entidade> list(Map params = [:]) {
        Integer max = params.int('max') ?: 50
        Integer offset = params.int('offset') ?: 0
        return Entidade.list(max: max, offset: offset, sort: 'nome', order: 'asc')
    }

    Entidade save(Map data) {
        Entidade entidade = new Entidade()
        entidade.properties = data
        entidade.save(flush: true, failOnError: true)
        return entidade
    }

    Entidade update(Long id, Map data) {
        Entidade entidade = Entidade.get(id)
        if (!entidade) return null

        // Extrair campos de enum corretamente
        data.each { key, value ->
            if (value instanceof Map && value.name) {
                data[key] = value.name
            }
        }

        // Remover version para evitar conflito
        data.remove('version')

        entidade.properties = data
        entidade.save(flush: true, failOnError: true)
        return entidade
    }

    void delete(Long id) {
        Entidade entidade = Entidade.get(id)
        if (entidade) {
            entidade.delete(flush: true)
        }
    }

    List<Entidade> search(String query) {
        if (!query || query.length() < 2) return []

        String term = "%${query.toLowerCase()}%"
        return Entidade.createCriteria().list {
            or {
                ilike('nome', term)
                ilike('codigo', term)
                ilike('nuit', term)
            }
            maxResults(20)
            order('nome', 'asc')
        }
    }

    long count() {
        return Entidade.count()
    }

    /**
     * Formata entidade para JSON limpo (sem objetos Enum)
     */
    Map formatarParaJson(Entidade entidade) {
        if (!entidade) return [:]

        return [
                id: entidade.id,
                codigo: entidade.codigo,
                nome: entidade.nome,
                tipoDePessoa: entidade.tipoDePessoa?.name(),
                ativo: entidade.ativo,
                classificacao: entidade.classificacao?.name(),
                dataDeEmissao: entidade.dataDeEmissao,
                dataDeValidade: entidade.dataDeValidade,
                dataDeNascimento: entidade.dataDeNascimento,
                emDivida: entidade.emDivida,
                email: entidade.email,
                estadoCivil: entidade.estadoCivil?.name(),
                genero: entidade.genero?.name(),
                localDeTrabalho: entidade.localDeTrabalho,
                nacionalidade: entidade.nacionalidade,
                arquivoDeIdentificao: entidade.arquivoDeIdentificao,
                nuit: entidade.nuit,
                numeroDeIdentificao: entidade.numeroDeIdentificao,
                profissao: entidade.profissao,
                residencia: entidade.residencia,
                telefone: entidade.telefone,
                telefone1: entidade.telefone1,
                telefone2: entidade.telefone2,
                tipoDeIdentificao: entidade.tipoDeIdentificao?.name(),
                usuario: entidade.usuario ? [
                        id: entidade.usuario.id,
                        username: entidade.usuario.username
                ] : null,
                version: entidade.version
        ]
    }

    /**
     * Formata lista de entidades para JSON limpo
     */
    List<Map> formatarListaParaJson(List<Entidade> entidades) {
        return entidades.collect { formatarParaJson(it) }
    }
}