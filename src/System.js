import Entity from './Entity.js'
import GroupManager from './GroupManager.js'
import ResourceManager from './ResourceManager.js'
import RoleManager from './RoleManager.js'
import UserManager from './UserManager.js'

export default class System extends Entity {
  #resources
  #roles
  #groups
  #users

  constructor ({ name, description, resources = [], groups = [], roles = [], users = [] }) {
    super('System', null, null, { name, description })

    this.#resources = new ResourceManager(this)
    this.#roles = new RoleManager(this)
    this.#groups = new GroupManager(this)
    this.#users = new UserManager(this)

    ;[
      [resources, this.#resources],
      [groups, this.#groups],
      [roles, this.#roles],
      [users, this.#users]
    ].forEach(([collection, destination]) => {
      for (const item of collection) {
        destination.add(item)
      }  
    })
  }

  addResource = (name, cfg) => this.#resources.add(name, cfg)
  getResource = name => this.#resources.get(name)
  hasResource = name => this.#resources.has(name)
  removeResource = name => this.#resources.remove(name)

  addGroup = (name, cfg) => this.#groups.add(name, cfg)
  getGroup = name => this.#groups.get(name)
  hasGroup = name => this.#groups.has(name)
  removeGroup = name => this.#groups.remove(name)

  addRole = (name, cfg) => this.#roles.add(name, cfg)
  getRole = name => this.#roles.get(name)
  hasRole = name => this.#roles.has(name)
  removeRole = name => this.#roles.remove(name)

  addUser = (name, cfg) => this.#users.add(name, cfg)
  getUser = name => this.#users.get(name)
  hasUser = name => this.#users.has(name)
  removeUser = name => this.#users.remove(name)

  logError (error) {
    console.error(`System "${this.name}" error: ${error}`)
  }

  toJSON () {
    return {
      ...super.toJSON(),
      resources: this.#resources.toJSON(),
      groups: this.#groups.toJSON(),
      roles: this.#roles.toJSON(),
      users: this.#users.toJSON()
    }
  }
}