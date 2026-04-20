package app.timali

import groovy.transform.EqualsAndHashCode
import groovy.transform.ToString

@EqualsAndHashCode(includes='username')
@ToString(includes='username', includeNames=true, includePackage=false)
class Usuario implements Serializable {

    private static final long serialVersionUID = 1L

    String username
    String password
    boolean enabled = true
    boolean accountExpired
    boolean accountLocked
    boolean passwordExpired

    static constraints = {
        username nullable: false, blank: false, unique: true
        password nullable: false, blank: false
    }

    static mapping = {
        password column: '`password`'
        table 'auth_user'
    }

    Set<Role> getAuthorities() {
        UsuarioRole.findAllByUsuario(this).collect { it.role } as Set<Role>
    }

    def beforeInsert() {
        encodePassword()
    }

    def beforeUpdate() {
        if (isDirty('password')) {
            encodePassword()
        }
    }

    protected void encodePassword() {
        if (springSecurityService) {
            password = springSecurityService.encodePassword(password)
        }
    }

    static transients = ['springSecurityService']
    def springSecurityService
}
