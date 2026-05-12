package app.timali

import grails.gorm.transactions.Transactional

@Transactional
class EntidadeService {

    IdentificacaoService identificacaoService
    ContactoService contactoService
    DadosPessoaisService dadosPessoaisService

    Entidade get(Long id) {
        return Entidade.get(id)
    }

    List<Entidade> list(Map params = [:]) {
        Integer max = params.int('max') ?: 50
        Integer offset = params.int('offset') ?: 0
        return Entidade.list(max: max, offset: offset, sort: 'nome', order: 'asc')
    }

    List<Entidade> search(String query) {
        if (!query || query.length() < 2) return []
        String term = "%${query.toLowerCase()}%"
        return Entidade.createCriteria().list {
            or {
                ilike('nome', term)
                ilike('codigo', term)
            }
            maxResults(20)
            order('nome', 'asc')
        }
    }

    long count() {
        return Entidade.count()
    }


    @Transactional
    Entidade save(Map data) {
        // ... verificações de duplicata e unicidade ...

        // 1. Criar a entidade
        Entidade entidade = new Entidade()
        entidade.nome = data.nome
        entidade.tipoDePessoa = data.tipoDePessoa as TipoDePessoa
        entidade.classificacao = data.classificacao ? (data.classificacao as Classificacao) : null
        entidade.ativo = data.ativo != null ? data.ativo : true

        if (data.usuario?.id) {
            entidade.usuario = Usuario.load(data.usuario.id)
        }

        // 2. Criar sub-entidades ANTES de salvar
        if (data.identificacao && temDadosIdentificacao(data.identificacao)) {
            Identificacao ident = new Identificacao()
            ident.tipoDeIdentificao = data.identificacao.tipoDeIdentificao?.toString()?.toUpperCase() as TipoDeIdentificacao
            ident.numeroDeIdentificao = data.identificacao.numeroDeIdentificao
            ident.nuit = data.identificacao.nuit
            ident.dataDeEmissao = DateConverter.safeParse(data.identificacao?.dataDeEmissao)
            ident.dataDeValidade = DateConverter.safeParse(data.identificacao?.dataDeValidade)
            entidade.identificacao = ident
        }

        if (data.contacto && temDadosContacto(data.contacto)) {
            Contacto cont = new Contacto()
            cont.telefone = data.contacto.telefone
            cont.telefone1 = data.contacto.telefone1
            cont.telefone2 = data.contacto.telefone2
            cont.email = data.contacto.email
            cont.residencia = data.contacto.residencia
            cont.nacionalidade = data.contacto.nacionalidade
            cont.profissao = data.contacto.profissao
            cont.localDeTrabalho = data.contacto.localDeTrabalho
            entidade.contacto = cont
        }

        if (data.dadosPessoais && temDadosDadosPessoais(data.dadosPessoais)) {
            DadosPessoais dp = new DadosPessoais()
            dp.genero = data.dadosPessoais.genero?.toString()?.toUpperCase() as Genero
            dp.estadoCivil = data.dadosPessoais.estadoCivil?.toString()?.toUpperCase() as EstadoCivil
            dp.dataDeNascimento =DateConverter.safeParse(data.dadosPessoais?.dataDeNascimento )
            entidade.dadosPessoais = dp
        }

        // 3. Salvar a entidade UMA ÚNICA VEZ
        entidade.save(flush: true, failOnError: true)

        return entidade
    }



    Entidade atualizar(Long id, Map data) {
        Entidade entidade = Entidade.get(id)
        if (!entidade) return null

        // Dados básicos
        if (data.nome != null) entidade.nome = data.nome
        if (data.tipoDePessoa) entidade.tipoDePessoa = data.tipoDePessoa as TipoDePessoa
        if (data.classificacao) entidade.classificacao = data.classificacao as Classificacao
        if (data.ativo != null) entidade.ativo = data.ativo

        entidade.save(flush: true, failOnError: true)

        // Sub-entidades - aqui usa atualizar pois a entidade já existe
        if (data.identificacao) {
            identificacaoService.atualizar(entidade, converterParaMap(data.identificacao))
        }

        if (data.contacto) {
            contactoService.atualizar(entidade, converterParaMap(data.contacto))
        }

        if (data.dadosPessoais) {
            dadosPessoaisService.atualizar(entidade, converterParaMap(data.dadosPessoais))
        }

        return entidade
    }

    void delete(Long id) {
        Entidade entidade = Entidade.get(id)
        if (entidade) {
            entidade.delete(flush: true)
        }
    }

    Map formatarParaJson(Entidade e) {
        if (!e) return [:]

        return [
                id: e.id,
                codigo: e.codigo,
                nome: e.nome,
                tipoDePessoa: e.tipoDePessoa?.name(),
                ativo: e.ativo,
                classificacao: e.classificacao?.name(),
                emDivida: e.emDivida,

                identificacao: identificacaoService.formatarParaJson(e.identificacao),
                contacto: contactoService.formatarParaJson(e.contacto),
                dadosPessoais: dadosPessoaisService.formatarParaJson(e.dadosPessoais),

                usuario: e.usuario ? [
                        id: e.usuario.id,
                        username: e.usuario.username
                ] : null,

                version: e.version
        ]
    }

    List<Map> formatarListaParaJson(List<Entidade> entidades) {
        return entidades.collect { formatarParaJson(it) }
    }

    // Método auxiliar para converter JSONObject para Map
    private Map converterParaMap(def obj) {
        if (obj instanceof Map) {
            return (Map) obj
        }

        // Forçar conversão de JSONObject para Map
        Map resultado = [:]
        if (obj != null) {
            try {
                // Método 1: Usar keySet() para JSONObject
                obj.keySet().each { key ->
                    resultado[key as String] = obj.get(key)
                }
            } catch (Exception e1) {
                try {
                    // Método 2: Usar each
                    obj.each { key, value ->
                        resultado[key as String] = value
                    }
                } catch (Exception e2) {
                    // Método 3: Converter para string e depois para Map
                    try {
                        String jsonString = obj.toString()
                        resultado = new grails.converters.JSON(jsonString) as Map
                    } catch (Exception e3) {
                        println "ERRO ao converter: ${e3.message}"
                    }
                }
            }
        }
        return resultado
    }

    private boolean temDadosIdentificacao(def data) {
        return data?.numeroDeIdentificao != null ||
                data?.tipoDeIdentificao != null ||
                data?.nuit != null ||
                data?.dataDeEmissao != null ||
                data?.dataDeValidade != null ||
                data?.arquivoDeIdentificao != null
    }

    private boolean temDadosContacto(def data) {
        return data?.email != null ||
                data?.telefone != null ||
                data?.telefone1 != null ||
                data?.telefone2 != null ||
                data?.residencia != null
    }

    private boolean temDadosDadosPessoais(def data) {
        return data?.dataNascimento != null ||
                data?.genero != null ||
                data?.estadoCivil != null
    }
}