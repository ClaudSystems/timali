package app.timali

import grails.gorm.transactions.Transactional
import groovy.sql.Sql
import org.springframework.beans.factory.annotation.Autowired
import javax.sql.DataSource

@Transactional
class GenericUpdateService {

    @Autowired
    DataSource dataSource

    def update(String entityName, Long id, Map data) {
        println "=========================================="
        println "=== GENERIC UPDATE (SQL DIRETO) ==="
        println "Entidade: ${entityName}"
        println "ID: ${id}"
        println "=========================================="

        String tableName = entityName.toLowerCase()
        Sql sql = new Sql(dataSource)

        try {
            data.each { key, value ->
                if (key in ['id', 'version', 'codigo', 'class', 'metaClass']) return
                if (value == null || value.toString().trim().isEmpty()) return

                try {
                    String columnName = camelToSnake(key)
                    String updateSql = "UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?"

                    // Converter valor para o tipo correto
                    def convertedValue = convertValue(value)

                    println "SQL: ${updateSql}"
                    println "Valor original: ${value} -> Convertido: ${convertedValue} (${convertedValue.class.simpleName})"

                    def result = sql.executeUpdate(updateSql, [convertedValue, id])

                    if (result > 0) {
                        println "✅ Campo '${key}' atualizado!"
                    }
                } catch (Exception e) {
                    println "⚠️ Erro no campo '${key}': ${e.message}"
                }
            }
        } finally {
            sql.close()
        }

        def domainClass = Class.forName("app.timali.${entityName}")
        domainClass.withSession { session -> session.clear() }

        return domainClass.get(id)
    }

    private String camelToSnake(String camel) {
        camel.replaceAll(/([A-Z])/, '_$1').toLowerCase()
    }

    private def convertValue(def value) {
        if (value == null) return null

        // Se já for Boolean, Number ou Date, retorna como está
        if (value instanceof Boolean || value instanceof Number || value instanceof Date) {
            return value
        }

        def str = value.toString().trim()

        // Detectar boolean
        if (str.equalsIgnoreCase('true')) return true
        if (str.equalsIgnoreCase('false')) return false

        // Detectar número inteiro
        if (str.isInteger()) return str.toInteger()

        // Detectar número decimal
        if (str.isNumber() && str.contains('.')) return str.toDouble()

        // Detectar data ISO (yyyy-MM-dd)
        if (str ==~ /\d{4}-\d{2}-\d{2}/) {
            return Date.parse('yyyy-MM-dd', str)
        }

        // String normal
        return str
    }
}