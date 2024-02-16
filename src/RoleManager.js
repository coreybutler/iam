import Manager from './Manager.js'
import Role from './Role.js'
import { throwError } from './utilities.js'

export default class RoleManager extends Manager {
  constructor ({ domain, roles }) {
    super({
      type: 'Role',
      namespace: 'role',
      domain,
      items: roles,
      ItemConstructor: Role
    })

    const { universalRole } = this.domain

    roles.some(({ name }) => name === universalRole?.name)
      ? throwError(this, `Cannot add role "${universalRole.name}". This name is reserved for the Universal User Role.`)
      : this.add(universalRole, true)
  }

  find ({ name, resource }) {
    return super.find(role => role.name.includes(name) || role.isAuthorized(resource))
  }

  remove (name) {
    return name === this.domain.universalRole.name
      ? throwError(this.domain, `Cannot remove "${name}" role. This is a reserved role which is automatically applied to all users. Instead of removing it, you can remove its assigned roles and permissions. NOTE: This will affect all users!`)
      : super.remove(name)
  }
}