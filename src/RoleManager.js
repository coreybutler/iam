import Manager from './Manager.js'
import Role from './Role.js'

export default class RoleManager extends Manager {
  constructor (domain, parent, roles) {
    super('Role', Role, ...arguments)
  }

  find ({ name, resource }) {
    return super.find(role => role.name.includes(name) || role.isAuthorized(resource))
  }
}