package app.timali

import grails.gorm.DetachedCriteria
import groovy.transform.ToString
import org.apache.commons.lang3.builder.HashCodeBuilder

@ToString(includeNames=true, includePackage=false)
class UsuarioRole implements Serializable {

    private static final long serialVersionUID = 1L

    Usuario usuario
    Role role

    @Override
    boolean equals(other) {
        if (other instanceof UsuarioRole) {
            other.usuarioId == usuario?.id && other.roleId == role?.id
        }
    }

    @Override
    int hashCode() {
        def builder = new HashCodeBuilder()
        if (usuario) builder.append(usuario.id)
        if (role) builder.append(role.id)
        builder.toHashCode()
    }

    static UsuarioRole get(long usuarioId, long roleId) {
        criteriaFor(usuarioId, roleId).get()
    }

    static boolean exists(long usuarioId, long roleId) {
        criteriaFor(usuarioId, roleId).count() > 0
    }

    private static DetachedCriteria criteriaFor(long usuarioId, long roleId) {
        UsuarioRole.where {
            usuario == Usuario.load(usuarioId) &&
            role == Role.load(roleId)
        }
    }

    static UsuarioRole create(Usuario usuario, Role role, boolean flush = false) {
        def instance = new UsuarioRole(usuario: usuario, role: role)
        instance.save(flush: flush)
        instance
    }

    static boolean remove(Usuario u, Role r) {
        if (u != null && r != null) {
            UsuarioRole.where { usuario == u && role == r }.deleteAll()
        }
    }

    static void removeAll(Usuario u) {
        if (u != null) {
            UsuarioRole.where { usuario == u }.deleteAll()
        }
    }

    static void removeAll(Role r) {
        if (r != null) {
            UsuarioRole.where { role == r }.deleteAll()
        }
    }

    static mapping = {
        id composite: ['usuario', 'role']
        version false
        table 'auth_user_role'
    }
}
