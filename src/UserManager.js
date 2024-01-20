import Manager from './Manager.js'
import User from './User.js'

export default class UserManager extends Manager {
  constructor (domain, parent, users) {
    super('User', User, ...arguments)
  }

  find ({ name, role, resource }) {
    return super.find(user => user.name.includes(name) || user.hasRole(role) || user.isAuthorized(resource))
  }
}