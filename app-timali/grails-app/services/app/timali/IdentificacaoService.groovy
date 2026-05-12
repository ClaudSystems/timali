package app.timali

import grails.gorm.transactions.Transactional

@Transactional
class IdentificacaoService {

    Identificacao get(Long id) {
        return Identificacao.get(id)
    }


    Identificacao criar(Entidade entidade, Map data) {
        // 1. Buscar entidade fresca do banco
        Entidade entidadePersistida = Entidade.get(entidade.id)

        // 2. Criar identificacao
        Identificacao ident = new Identificacao()
        aplicarDados(ident, data)

        // 3. Atribuir nos DOIS lados
        ident.entidade = entidadePersistida
        entidadePersistida.identificacao = ident

        // 4. Salvar a IDENTIFICACAO primeiro (ela tem belongTo, então salva a FK corretamente)
        ident.save(flush: true, failOnError: true)

        return ident
    }


    Identificacao atualizar(Entidade entidade, Map data) {
        Identificacao ident = Identificacao.findByEntidade(entidade)

        if (!ident) {
            return criar(entidade, data)
        }

        aplicarDados(ident, data)
        ident.save(flush: true, failOnError: true)
        return ident
    }

    void deletar(Long id) {
        Identificacao ident = Identificacao.get(id)
        if (ident) {
            ident.delete(flush: true)
        }
    }

    void deletarPorEntidade(Entidade entidade) {
        Identificacao ident = Identificacao.findByEntidade(entidade)
        if (ident) {
            ident.delete(flush: true)
        }
    }

    /**
     * Lógica de aplicação de dados com tratamento seguro de Enums e Datas.
     */
    private void aplicarDados(Identificacao ident, Map data) {
        // Tratamento do Enum TipoDeIdentificacao
        if (data.tipoDeIdentificao) {
            ident.tipoDeIdentificao = converterParaEnum(TipoDeIdentificacao, data.tipoDeIdentificao)
        }

        if (data.numeroDeIdentificao != null) ident.numeroDeIdentificao = data.numeroDeIdentificao
        if (data.nuit != null) ident.nuit = data.nuit
        if (data.arquivoDeIdentificao != null) ident.arquivoDeIdentificao = data.arquivoDeIdentificao

        // Datas tratadas pelo DateConverter
        if (data.dataDeEmissao != null) {
            ident.dataDeEmissao = DateConverter.safeParse(data.dataDeEmissao)
        }
        if (data.dataDeValidade != null) {
            ident.dataDeValidade = DateConverter.safeParse(data.dataDeValidade)
        }
    }

    /**
     * Helper para conversão de Enums.
     */
    private <T extends Enum<T>> T converterParaEnum(Class<T> enumClass, Object valor) {
        if (valor == null) return null
        if (enumClass.isInstance(valor)) return (T) valor
        try {
            return Enum.valueOf(enumClass, valor.toString().trim().toUpperCase())
        } catch (Exception e) {
            return null
        }
    }

    // --- Verificações de Unicidade ---

    boolean existePorNumeroIdentificacao(String numero) {
        if (!numero) return false
        return Identificacao.countByNumeroDeIdentificao(numero) > 0
    }

    boolean existePorNuit(String nuit) {
        if (!nuit) return false
        return Identificacao.countByNuit(nuit) > 0
    }

    /**
     * Formata o objeto para resposta JSON.
     */
    Map formatarParaJson(Identificacao ident) {
        if (!ident) return null

        return [
                id: ident.id,
                tipoDeIdentificao: ident.tipoDeIdentificao?.name(),
                numeroDeIdentificao: ident.numeroDeIdentificao,
                nuit: ident.nuit,
                arquivoDeIdentificao: ident.arquivoDeIdentificao,
                dataDeEmissao: DateConverter.format(ident.dataDeEmissao),
                dataDeValidade: DateConverter.format(ident.dataDeValidade),
                version: ident.version
        ]
    }
}