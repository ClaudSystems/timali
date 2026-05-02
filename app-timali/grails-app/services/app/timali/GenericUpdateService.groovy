// grails-app/services/app/timali/GenericUpdateService.groovy
package app.timali

import grails.gorm.transactions.Transactional
import groovy.sql.Sql
import org.grails.orm.hibernate.HibernateDatastore
import org.hibernate.SessionFactory
import org.springframework.beans.factory.annotation.Autowired
import javax.sql.DataSource

@Transactional
class GenericUpdateService {

    @Autowired
    DataSource dataSource

    @Autowired
    HibernateDatastore hibernateDatastore

    def update(String entityName, Long id, Map data) {
        println "=========================================="
        println "=== GENERIC UPDATE (SQL DIRETO) ==="
        println "Entidade: ${entityName}"
        println "ID: ${id}"
        println "=========================================="

        // Detecta automaticamente o nome da tabela via Hibernate
        String tableName = getTableNameFromHibernate(entityName)
        println "Tabela detectada: ${tableName}"

        Sql sql = new Sql(dataSource)

        try {
            // Primeiro, verifica se o registro existe
            String checkSql = "SELECT COUNT(*) FROM ${tableName} WHERE id = ?"
            def count = sql.firstRow(checkSql, [id])?.count ?: 0

            if (count == 0) {
                println "❌ Registro não encontrado: ID ${id} na tabela ${tableName}"
                throw new RuntimeException("Registro não encontrado")
            }

            println "✅ Registro encontrado. Iniciando atualização..."

            data.each { key, value ->
                // Ignora campos especiais e metadados
                if (key in ['id', 'version', 'class', 'metaClass', 'dateCreated', 'lastUpdated', 'enumType', 'declaringClass']) {
                    return
                }

                try {
                    String columnName = camelToSnake(key)

                    // Verifica se a coluna existe na tabela
                    if (!columnExists(tableName, columnName, sql)) {
                        println "⚠️ Coluna '${columnName}' não existe na tabela '${tableName}'. Ignorando..."
                        return
                    }

                    // Converte o valor adequadamente
                    def convertedValue = convertValueForColumn(value, key)

                    if (convertedValue != null && !convertedValue.toString().trim().isEmpty()) {
                        String updateSql = "UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?"

                        println "SQL: ${updateSql}"
                        println "Campo: ${key} -> ${columnName}"
                        println "Valor: ${convertedValue} (${convertedValue.class.simpleName})"

                        def result = sql.executeUpdate(updateSql, [convertedValue, id])

                        if (result > 0) {
                            println "✅ Campo '${key}' atualizado com sucesso!"
                        } else {
                            println "⚠️ Nenhuma linha afetada para '${key}'"
                        }
                    } else {
                        println "⏭️ Campo '${key}' ignorado (valor nulo ou vazio)"
                    }
                } catch (Exception e) {
                    println "❌ Erro no campo '${key}': ${e.message}"
                    e.printStackTrace()
                    // Continua processando outros campos
                }
            }

            sql.commit()
            println "✅ Transação confirmada!"

        } catch (Exception e) {
            println "❌ Erro na transação: ${e.message}"
            try {
                sql.rollback()
            } catch (Exception rollbackEx) {
                println "⚠️ Erro no rollback: ${rollbackEx.message}"
            }
            throw e
        } finally {
            try {
                sql.close()
            } catch (Exception closeEx) {
                println "⚠️ Erro ao fechar conexão: ${closeEx.message}"
            }
        }

        // Recarrega a entidade do banco
        return reloadEntity(entityName, id)
    }

    /**
     * Obtém o nome da tabela via SessionFactory do Hibernate (método mais confiável)
     */
    private String getTableNameFromHibernate(String entityName) {
        try {
            // Tenta carregar a classe de domínio
            def domainClass = Class.forName("app.timali.${entityName}")

            // Obtém o SessionFactory do domínio
            def sessionFactory = domainClass.getSessionFactory()

            if (sessionFactory) {
                // Obtém os metadados da classe (onde está o nome real da tabela)
                def classMetadata = sessionFactory.getClassMetadata(domainClass)
                if (classMetadata && classMetadata.tableName) {
                    println "✅ Nome da tabela obtido via ClassMetadata: ${classMetadata.tableName}"
                    return classMetadata.tableName
                }

                // Alternativa: tenta via metamodel
                try {
                    def metamodel = sessionFactory.metamodel
                    def entityPersister = metamodel.entityPersister(domainClass.name)
                    if (entityPersister?.identifierTableName) {
                        println "✅ Nome da tabela obtido via Metamodel: ${entityPersister.identifierTableName}"
                        return entityPersister.identifierTableName
                    }
                } catch (Exception metaEx) {
                    println "⚠️ Metamodel não disponível: ${metaEx.message}"
                }

                // Terceira alternativa: via EntityManager
                try {
                    def entityManager = sessionFactory.createEntityManager()
                    def tableName = entityManager.metamodel.entity(domainClass).name
                    if (tableName) {
                        println "✅ Nome da tabela obtido via EntityManager: ${tableName}"
                        return tableName
                    }
                } catch (Exception emEx) {
                    println "⚠️ EntityManager não disponível: ${emEx.message}"
                }
            }
        } catch (Exception e) {
            println "⚠️ Não foi possível obter tabela via Hibernate: ${e.message}"
        }

        // Fallback: usa mapeamento manual
        return getTableNameFallback(entityName)
    }

    /**
     * Fallback manual (apenas para quando o Hibernate falhar)
     */
    private String getTableNameFallback(String entityName) {
        // Mapeamento manual para TODAS as entidades conhecidas
        def tableMapping = [
                'DefinicaoCredito': 'definicoes_credito',
                'Credito': 'creditos',
                'Parcela': 'parcelas',
                'Entidade': 'entidade',
                'Taxa': 'taxas',
                'Feriado': 'feriados',
                'Produto': 'produtos',
                'AuthUser': 'auth_user',
                'AuthRole': 'auth_role',
                'Settings': 'settings'  // ← ADICIONAR ESTA LINHA
        ]

        if (tableMapping.containsKey(entityName)) {
            println "✅ Nome da tabela obtido via mapeamento manual: ${tableMapping[entityName]}"
            return tableMapping[entityName]
        }

        // Regra geral CORRIGIDA: converte camelCase para snake_case
        String snake = entityName.replaceAll(/([A-Z])/, '_$1').toLowerCase()
        // Remove underscore inicial se existir
        if (snake.startsWith('_')) {
            snake = snake.substring(1)
        }
        println "⚠️ Nome da tabela gerado por regra geral: ${snake}"
        return snake
    }

    /**
     * Verifica se uma coluna existe na tabela
     */
    private boolean columnExists(String tableName, String columnName, Sql sql) {
        try {
            def result = sql.firstRow("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = ? AND column_name = ?
            """, [tableName, columnName])

            return result != null
        } catch (Exception e) {
            // Se der erro, assume que existe para tentar a atualização
            println "⚠️ Não foi possível verificar coluna '${columnName}': ${e.message}"
            return true
        }
    }

    /**
     * Converte o valor baseado no tipo do campo
     */
    private def convertValueForColumn(def value, String fieldName) {
        if (value == null) return null

        // Tratamento especial para Enums
        if (fieldName in ['tipoCalculo', 'tipo', 'abrangencia', 'periodicidade', 'formaDeCalculo', 'periodicidadeMora']) {
            if (value instanceof Map && value.name) {
                return value.name  // Extrai o nome do Enum
            }
            return value?.toString()
        }

        // Tratamento para JSON
        if (fieldName == 'faixasJson' && value instanceof Map) {
            return groovy.json.JsonOutput.toJson(value)
        }

        // Tratamento para relacionamentos (taxa, entidade, etc.)
        if (value instanceof Map && value.id) {
            return value.id  // Retorna apenas o ID do relacionamento
        }

        // Converte valores normais
        return convertValue(value)
    }

    /**
     * Conversão genérica de valores
     */
    private def convertValue(def value) {
        if (value == null) return null

        // Se já for um tipo primitivo ou data
        if (value instanceof Boolean || value instanceof Number || value instanceof Date) {
            return value
        }

        // Se for uma string
        if (value instanceof String) {
            def str = value.trim()
            if (str.isEmpty()) return null

            // Detectar boolean
            if (str.equalsIgnoreCase('true')) return true
            if (str.equalsIgnoreCase('false')) return false

            // Detectar número inteiro
            if (str.isInteger()) return str.toInteger()

            // Detectar número decimal
            if (str.isBigDecimal()) return new BigDecimal(str)
            if (str.isNumber() && str.contains('.')) return str.toDouble()

            // String normal
            return str
        }

        // Outros tipos: converte para string
        return value.toString().trim()
    }

    /**
     * Converte camelCase para snake_case
     */
    private String camelToSnake(String camel) {
        String snake = camel.replaceAll(/([A-Z])/, '_$1').toLowerCase()
        // Remove underscore inicial se existir
        if (snake.startsWith('_')) {
            snake = snake.substring(1)
        }
        return snake
    }

    /**
     * Recarrega a entidade do banco de dados
     */
    private def reloadEntity(String entityName, Long id) {
        try {
            def domainClass = Class.forName("app.timali.${entityName}")

            // Recarrega a entidade
            return domainClass.findById(id)
        } catch (Exception e) {
            println "❌ Erro ao recarregar entidade: ${e.message}"
            return null
        }
    }
}