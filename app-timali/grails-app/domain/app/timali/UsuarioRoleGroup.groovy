// grails-app/domain/app/timali/UsuarioRoleGroup.groovy
package app.timali

import grails.gorm.DetachedCriteria
import groovy.transform.ToString
import org.apache.commons.lang3.builder.HashCodeBuilder

@ToString(includeNames=true, includePackage=false)
class UsuarioRoleGroup implements Serializable {

    private static final long serialVersionUID = 1L

    Usuario usuario
    RoleGroup roleGroup

    static constraints = {
        usuario nullable: false
        roleGroup nullable: false, unique: ['usuario']
    }

    @Override
    boolean equals(other) {
        if (other instanceof UsuarioRoleGroup) {
            other.usuarioId == usuario?.id && other.roleGroupId == roleGroup?.id
        }
    }

    @Override
    int hashCode() {
        def builder = new HashCodeBuilder()
        if (usuario) builder.append(usuario.id)
        if (roleGroup) builder.append(roleGroup.id)
        builder.toHashCode()
    }

    static UsuarioRoleGroup get(long usuarioId, long roleGroupId) {
        criteriaFor(usuarioId, roleGroupId).get()
    }

    static boolean exists(long usuarioId, long roleGroupId) {
        criteriaFor(usuarioId, roleGroupId).count() > 0
    }

    private static DetachedCriteria criteriaFor(long usuarioId, long roleGroupId) {
        UsuarioRoleGroup.where {
            usuario == Usuario.load(usuarioId) &&
                    roleGroup == RoleGroup.load(roleGroupId)
        }
    }

    static UsuarioRoleGroup create(Usuario usuario, RoleGroup roleGroup, boolean flush = false) {
        def instance = new UsuarioRoleGroup(usuario: usuario, roleGroup: roleGroup)
        instance.save(flush: flush)
        instance
    }

    static boolean remove(Usuario u, RoleGroup rg) {
        if (u != null && rg != null) {
            UsuarioRoleGroup.where { usuario == u && roleGroup == rg }.deleteAll()
        }
    }

    static void removeAll(Usuario u) {
        if (u != null) {
            UsuarioRoleGroup.where { usuario == u }.deleteAll()
        }
    }

    static void removeAll(RoleGroup rg) {
        if (rg != null) {
            UsuarioRoleGroup.where { roleGroup == rg }.deleteAll()
        }
    }

    static mapping = {
        id composite: ['usuario', 'roleGroup']
        version false
        table 'auth_user_role_group'
    }
}