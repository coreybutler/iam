import Entity from './Entity.js'
import MappingManager from './MappingManager.js'
import ResourceManager from './ResourceManager.js'
import Role from './Role.js'
import RoleManager from './RoleManager.js'
import UserManager from './UserManager.js'

export default class Domain extends Entity {
  #mappings
  #resources
  #roles
  #universalRole
  #users

  constructor ({ name, description, resources = [], roles = [], users = [], mappings = [], universalRole = {} }) {
    super({
      type: 'Domain',
      name,
      description,

      internalEvents: [
        'mapping.add', 'mapping.remove',
        'resource.add', 'resource.remove',
        'role.add', 'role.remove',
        'user.add', 'user.remove'
      ]
    })

    this.#mappings = new MappingManager({ domain: this, mappings })
    this.#resources = new ResourceManager({ domain: this, resources })
    
    universalRole.name = universalRole.name ?? 'Universal'

    this.#universalRole = new Role({
      domain: this,
      ...universalRole
    }, true)

    this.#roles = new RoleManager({ domain: this, roles })
    this.#users = new UserManager({ domain: this, users })
  }

  get data () {
    return {
      ...super.data,
      mappings: this.#mappings.data,
      resources: this.#resources.data,
      roles: this.#roles.data,
      users: this.#users.data
    }
  }

  get mappings () {
    return this.#mappings.items
  }

  get resources () {
    return this.#resources.items
  }

  get roles () {
    return this.#roles.items
  }

  get universalRole () {
    return this.#universalRole
  }

  get users () {
    return this.#users.items
  }

  addMapping = cfg => this.#mappings.add(cfg)
  findMappings = criteria => this.#mappings.find(criteria)
  getMapping = name => this.#mappings.get(name)
  hasMapping = name => this.#mappings.has(name)
  removeMapping = name => this.#mappings.remove(name)

  addResource = cfg => this.#resources.add(cfg)
  getResource = name => this.#resources.get(name)
  findResources = ({ name, id }) => {}
  hasResource = name => this.#resources.has(name)
  removeResource = name => this.#resources.remove(name)

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
}