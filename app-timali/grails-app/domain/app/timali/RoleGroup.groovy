// grails-app/domain/app/timali/RoleGroup.groovy
package app.timali

import groovy.transform.EqualsAndHashCode
import groovy.transform.ToString

@EqualsAndHashCode(includes='name')
@ToString(includes='name', includeNames=true, includePackage=false)
class RoleGroup implements Serializable {

    private static final long serialVersionUID = 1L

    String name
    String description

    static hasMany = [roles: Role]

    static constraints = {
        name nullable: false, blank: false, unique: true, maxSize: 100
        description nullable: true, maxSize: 500
    }

    static mapping = {
        table 'role_group'
        cache true
        roles joinTable: [
                name: 'role_group_roles',
                key: 'role_group_id',
                column: 'role_id'
        ]
    }

    /**
     * Retorna todas as authorities das roles deste grupo
     */
    List<String> getAuthorities() {
        roles?.collect { it.authority } ?: []
    }
}