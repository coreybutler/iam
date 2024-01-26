import Manager from './Manager.js'
import Role from './Role.js'

export default class RoleManager extends Manager {
  constructor ({ domain, roles }) {
    super({
      type: 'Role',
      domain,
      items: roles,
      ItemConstructor: Role
    })
  }

  find ({ name, resource }) {
    return super.find(role => role.name.includes(name) || role.isAuthorized(resource))
  }
}