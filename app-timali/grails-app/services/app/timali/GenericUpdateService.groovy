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

        // CORRIGIDO: Detecta automaticamente o nome da tabela via Hibernate
        String tableName = getTableNameFromHibernate(entityName)
        println "Tabela detectada: ${tableName}"

        Sql sql = new Sql(dataSource)

        try {
            // Primeiro, verifica se o registro existe
            def checkSql = "SELECT COUNT(*) FROM ${tableName} WHERE id = ?"
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

                    if (convertedValue != null && convertedValue.toString().trim().isEmpty() == false) {
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
            sql.rollback()
            throw e
        } finally {
            sql.close()
        }

        // Recarrega a entidade do banco
        return reloadEntity(entityName, id)
    }

    /**
     * Obtém o nome da tabela diretamente do mapeamento Hibernate
     */
    private String getTableNameFromHibernate(String entityName) {
        try {
            // Tenta obter via Hibernate Datastore
            def sessionFactory = hibernateDatastore.sessionFactory
            def metamodel = sessionFactory.metamodel

            // Procura a entidade no metamodel
            def entityPersister = sessionFactory.getMetamodel().getEntities().find { entity ->
                entity.name.endsWith(".${entityName}") || entity.name == "app.timali.${entityName}"
            }

            if (entityPersister) {
                // Usa reflection para acessar informações da entidade
                def classMetadata = sessionFactory.getClassMetadata(Class.forName("app.timali.${entityName}"))
                if (classMetadata) {
                    return classMetadata.tableName
                }
            }
        } catch (Exception e) {
            println "⚠️ Não foi possível obter tabela via Hibernate: ${e.message}"
        }

        // Fallback: usa o padrão ou mapeamento manual
        return getTableNameFallback(entityName)
    }

    /**
     * Fallback para quando não consegue detectar via Hibernate
     */
    // grails-app/services/app/timali/GenericUpdateService.groovy
// Atualize o método getTableNameFallback()

    private String getTableNameFallback(String entityName) {
        // Mapeamento manual para casos especiais
        def tableMapping = [
                'Taxa': 'taxas',
                'Entidade': 'entidade',
                'Produto': 'produtos',
                'AuthUser': 'auth_user',
                'AuthRole': 'auth_role',
                'Feriado': 'feriados'  // ← ADICIONE ESTA LINHA
        ]

        if (tableMapping.containsKey(entityName)) {
            return tableMapping[entityName]
        }

        // Regra geral: nome da classe em minúsculo + 's'
        return camelToSnake(entityName) + 's'
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
            return true
        }
    }

    /**
     * Converte o valor baseado no tipo do campo
     */


    private def convertValueForColumn(def value, String fieldName) {
        if (value == null) return null

        // Tratamento especial para Enums
        if (fieldName in ['tipoCalculo', 'tipo', 'abrangencia']) {
            if (value instanceof Map && value.name) {
                return value.name  // Extrai o nome do Enum (ex: "FIXO", "NACIONAL")
            }
            return value?.toString()
        }

        // Tratamento para JSON
        if (fieldName == 'faixasJson' && value instanceof Map) {
            return groovy.json.JsonOutput.toJson(value)
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

        def str = value.toString().trim()

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

    /**
     * Converte camelCase para snake_case
     */
    private String camelToSnake(String camel) {
        camel.replaceAll(/([A-Z])/, '_$1').toLowerCase()
    }

    /**
     * Recarrega a entidade do banco de dados
     */
    private def reloadEntity(String entityName, Long id) {
        try {
            def domainClass = Class.forName("app.timali.${entityName}")

            // Limpa o cache do Hibernate
            domainClass.withSession { session ->
                session.clear()
            }

            // Recarrega a entidade
            return domainClass.get(id)
        } catch (Exception e) {
            println "❌ Erro ao recarregar entidade: ${e.message}"
            return null
        }
    }
}