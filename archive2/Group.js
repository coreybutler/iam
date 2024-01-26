import Entity from '../src/Entity.js'
import RoleManager from '../src/RoleManager.js'
import UserManager from '../src/UserManager.js'

export default class Group extends Entity {
  #roles
  #users

  constructor (config) {
    super({ type: 'Group', ...config })

    const { roles, users } = config

    this.#roles = new RoleManager({ domain: this.domain, parent: this, roles })
    this.#users = new UserManager({ domain: this.domain, parent: this, users })
  }

  destroy (removeMembers = true) {
    return this.domain.removeGroup(this.name, removeMembers)
  }

  isAuthorized (resource, right) {
    const roles = this.#roles.find({ resource })

    if (!right) return roles.length > 0
    
    console.log(roles)
    // check if any of the returned roles have the specified right
  }
}