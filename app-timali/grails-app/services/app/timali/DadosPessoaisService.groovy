package app.timali

import grails.gorm.transactions.Transactional

@Transactional
class DadosPessoaisService {

    DadosPessoais get(Long id) {
        return DadosPessoais.get(id)
    }

    /**
     * Cria os dados pessoais vinculados a uma Entidade.
     */
    DadosPessoais criar(Entidade entidade, Map data) {
        // 1. Buscar entidade fresca do banco
        Entidade entidadePersistida = Entidade.get(entidade.id)

        // 2. Criar identificacao
        DadosPessoais dp = new DadosPessoais()
        aplicarDados(dp, data)

        // 3. Atribuir nos DOIS lados
        dp.entidade = entidadePersistida
        entidadePersistida.dadosPessoais = dp

        // 4. Salvar a ENTIDADE (não a identificacao)
        entidadePersistida.save(flush: true, failOnError: true)

        return dp

    }

    /**
     * Atualiza ou cria se não existir.
     */
    DadosPessoais atualizar(Entidade entidade, Map data) {
        DadosPessoais dp = DadosPessoais.findByEntidade(entidade)

        if (!dp) {
            return criar(entidade, data)
        }

        aplicarDados(dp, data)
        dp.save(flush: true, failOnError: true)
        return dp
    }

    void deletar(Long id) {
        DadosPessoais dp = DadosPessoais.get(id)
        if (dp) {
            dp.delete(flush: true)
        }
    }

    void deletarPorEntidade(Entidade entidade) {
        DadosPessoais dp = DadosPessoais.findByEntidade(entidade)
        if (dp) {
            dp.delete(flush: true)
        }
    }

    /**
     * Lógica de conversão de tipos (String -> Enum, String -> Date).
     */
    private void aplicarDados(DadosPessoais dp, Map data) {
        // Gênero
        if (data.genero) {
            dp.genero = converterParaEnum(Genero, data.genero)
        }

        // Estado Civil
        if (data.estadoCivil) {
            dp.estadoCivil = converterParaEnum(EstadoCivil, data.estadoCivil)
        }

        // Data de Nascimento (Tratada pelo seu DateConverter)
        if (data.dataDeNascimento != null) {
            dp.dataDeNascimento = DateConverter.safeParse(data.dataDeNascimento)
        }
    }

    /**
     * Helper genérico para conversão de Enums com segurança.
     */
    private <T extends Enum<T>> T converterParaEnum(Class<T> enumClass, Object valor) {
        if (valor == null) return null
        if (enumClass.isInstance(valor)) return (T) valor

        try {
            return Enum.valueOf(enumClass, valor.toString().trim().toUpperCase())
        } catch (Exception e) {
            log.warn("Valor inválido para o enum ${enumClass.simpleName}: ${valor}")
            return null
        }
    }

    Map formatarParaJson(DadosPessoais dp) {
        if (!dp) return null

        return [
                id: dp.id,
                genero: dp.genero?.name(),
                estadoCivil: dp.estadoCivil?.name(),
                dataDeNascimento: DateConverter.format(dp.dataDeNascimento),
                version: dp.version
        ]
    }
}