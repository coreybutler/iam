import Entity from './Entity.js'
import GroupManager from './GroupManager.js'
import ResourceManager from './ResourceManager.js'
import RoleManager from './RoleManager.js'
import UserManager from './UserManager.js'

export default class Domain extends Entity {
  #resources
  #roles
  #groups
  #users

  constructor ({ name, description, resources = [], groups = [], roles = [], users = [] }) {
    super('Domain', null, null, { name, description })
    this.#resources = new ResourceManager(this, this, resources)
    this.#roles = new RoleManager(this, this, roles)
    this.#groups = new GroupManager(this, this, groups)
    this.#users = new UserManager(this, this, users)
  }

  addResource = cfg => this.#resources.add(cfg)
  getResource = name => this.#resources.get(name)
  findResources = ({ name, id }) => {}
  hasResource = name => this.#resources.has(name)
  removeResource = name => this.#resources.remove(name)

  addGroup = cfg => this.#groups.add(cfg)
  getGroup = name => this.#groups.get(name)
  findGroups = ({ name, id }) => {}
  hasGroup = name => this.#groups.has(name)
  removeGroup = name => this.#groups.remove(name)

  addRole = cfg => this.#roles.add(cfg)
  getRole = name => this.#roles.get(name)
  findRoles = criteria => this.#roles.find(criteria)
  hasRole = name => this.#roles.has(name)
  removeRole = name => this.#roles.remove(name)

  addUser = cfg => this.#users.add(cfg)
  findUsers = criteria => this.#users.find(criteria)
  getUser = name => this.#users.get(name)
  hasUser = name => this.#users.has(name)
  removeUser = name => this.#users.remove(name)

  logError = error => console.error(`Domain "${this.name}" error: ${error}`)

  toJSON () {
    return {
      ...super.toJSON(),
      resources: this.#resources.toJSON(),
      groups: this.#groups.toJSON(),
      roles: this.#roles.toJSON(),
      users: this.#users.toJSON()
    }
  }

  trace () {
    console.log('TODO: Trace lineage of specified elements')
  }
}