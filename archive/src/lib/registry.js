import { VERSION, REGISTRY_ID, hiddenconstant } from './utilities.js'
import Base from './base.js'
import Manager from './manager.js'
import Resource from './actors/resource.js'
import Role from './actors/role.js'
import User from './actors/user.js'
import Group from './actors/group.js'

/**
 * The registry is the driver of the IAM service,
 * serving as a central data store of all auth elements,
 * and as an auth query engine for applications.
 */
class Registry extends Base {
  #resources = new Manager(Resource)
  #roles = new Manager(Role)
  #users = new Manager({ fn: User, type: 'user' })
  #groups = new Manager({ fn: Group, type: 'group' })
  #currentUser = null
  #id = new Map()

  constructor () {
    super({ name: 'IAM', description: 'IAM system registry.' })

    Object.defineProperty(this, 'Base', hiddenconstant(Base))

    // Manage resources
    this.#resources.registry = this
    this.#resources.relay(this)
    this.on('resource.create', resource => this.#resources.add(resource))
    this.on('resource.destroyed', resource => this.#resources.delete(resource))

    // Manage roles
    this.#roles.registry = this
    this.#roles.relay(this)
    this.on('role.create', role => this.#roles.add(role))
    this.on('role.destroyed', role => this.#roles.delete(role))

    // Manage users
    this.#users.registry = this
    this.#users.relay(this)
    this.on('user.create', user => {
      this.#users.add(user)

      if (!this.#currentUser) {
        this.#currentUser = user
      }
    })
    this.on('user.destroyed', user => this.#users.delete(user))

    // Manage groups
    this.#groups.registry = this
    this.#groups.relay(this)
    this.on('group.create', group => this.#groups.add(group))
    this.on('group.destroyed', group => this.#groups.delete(group))
  }

  get version () {
    return VERSION
  }

  get configuration () {
    function serializeRights (rights) {
      return rights.map(r => {
        return {
          name: r.right === 'all' ? '*' : r.right.replace(':all', ':*'),
          description: r.description
        }
      })
    }

    const roles = this.#roles.data.roles.map(r => {
      const rights = {}
      Object.keys(r.rights).forEach(name => { rights[name] = serializeRights(r.rights[name]).map(rt => rt.name) })
      const result = {
        name: r.name,
        rights
      }

      if (r.description.trim().length > 0) {
        result.description = r.description
      }

      return result
    })

    const result = Object.assign({}, super.data, {
      resources: this.#resources.data.resources.map(r => {
        delete r.type
        r.rights = serializeRights(r.rights)

        if (!r.description || r.description.trim().length === 0) {
          delete r.description
        }

        return r
      }),
      roles,
      groups: this.#groups.data.groups.map(g => {
        delete g.memberOf
        delete g.type

        if (g.description.trim().length === 0) {
          delete g.description
        }

        if (g.members.length === 0) {
          delete g.members
        } else {
          g.members = g.members.map(m => { return { name: m.name, type: m.type } })
        }

        g.roles = g.roles.map(r => r.name)
        if (g.roles.length === 0) {
          delete g.roles
        }

        return g
      }),
      users: this.#users.data.users.map(u => {
        delete u.type

        if (u.description.trim().length === 0) {
          delete u.description
        }

        if (u.roles.length === 0) {
          delete u.roles
        }

        if (u.groups.length === 0) {
          delete u.groups
        }

        if (u.rights) {
          const rights = {}
          Object.keys(u.rights).forEach(name => { rights[name] = serializeRights(u.rights[name]).map(rt => rt.name) })

          u.rights = rights

          if (Object.keys(u.rights).length === 0) {
            delete u.rights
          }
        }

        return u
      })
    })

    delete result.type

    return result
  }

  get data () {
    const result = Object.assign({}, super.data, {
      resources: this.#resources.data.resources.map(resource => {
        return {
          name: resource.name,
          rights: resource.rights.map(r => r.name === 'all' ? '*' : r.name.replace(':all', ':*'))
        }
      }).sort((a, b) => a.name > b.name ? 1 : -1),
      roles: this.#roles.data.roles.map(role => {
        const rights = {}

        for (const [resource, perms] of Object.entries(role.rights)) {
          rights[resource] = perms.map(r => r.name === 'all' ? '*' : r.name.replace(':all', ':*'))
        }

        return {
          name: role.name,
          rights
        }
      }).sort((a, b) => a.name > b.name ? 1 : -1),
      groups: this.#groups.data.groups.map(g => g.name).sort(),
      users: this.#users.data.users.map(u => {
        delete u.type
        delete u.description
        return u
      })
    })

    delete result.type
    return result
  }

  /**
   * @property {String[]} CRUD
   * A static array containing the common CRUD rights, plus list:
   * `['create', 'read', 'update', 'delete', 'list']`
   *
   * _Commonly used to assign API permissions._
   */
  get CRUD () {
    return ['create', 'read', 'update', 'delete', 'list']
  }

  /**
   * @property {String[]} USAGE
   * A static array containing the common usage rights:
   * `['view', 'manage']`
   *
   * _Commonly used to assign app/component usage permissions._
   */
  get USAGE () {
    return ['view', 'manage']
  }

  /**
   * @property {User} currentUser
   * The current/active user of the system.
   * @warning
   * This property exists primarily for interactive
   * applications used by one user per instance, such
   * as a browser session or desktop app/webview.
   * This property is less useful in server
   * environments, such as API's, which may support
   * multiple users within the same process.
   */
  get currentUser () {
    return this.#currentUser
  }

  set currentUser (value) {
    const old = this.#currentUser

    if (!value) {
      this.#currentUser = null
    } else if (value instanceof User) {
      this.#currentUser = value
    } else {
      value = this.user(value)
      if (!value) {
        if (typeof value === 'string') {
          this.#currentUser = new User()
          this.#currentUser.name = value
        } else {
          throw new Error(`Invalid user: "${value}". currentUser only accepts IAM User objects or a string (user name)`)
        }
      } else {
        this.#currentUser = value
      }
    }

    this.emit('current.user.update', { old, new: this.#currentUser })
  }

  /**
   * Create new resources. This accepts any number of string arguments,
   * where each string represents the unique name of a system resource,
   * asset, or component.
   * @param  {string|object} name
   * The name of the resource. This can also be an object containing multiple
   * resources/rights.
   * @param  {String[]|Right[]}  [rights=['view']]
   * The resource rights that are assigned to this role. By default, `view`
   * is assigned if no other rights are provided.
   * @return {Resource|Resource[]}
   * Returns a resource, or an array of resources if an object containing one or more
   * resources was configured.
   */
  createResource (name = null, rights = ['view']) {
    if (typeof name === 'object') {
      const result = []
      for (let [nm, permissions] of Object.entries(name)) {
        permissions = Array.isArray(permissions) ? permissions : [permissions]
        result.push(this.#resources.create(nm, ...permissions))
      }

      return result
    } else {
      return this.#resources.create(name, ...rights)
    }
  }

  /**
   * @property {Resource[]} resources
   * An array of resources within the IAM system.
   */
  get resources () {
    return this.#resources.items
  }

  /**
   * @property {String[]} resourceList
   * An array of resource _names_ within the IAM system.
   */
  get resourceList () {
    return this.#resources.list
  }

  /**
   * Retrieve a resource by name.
   * @param {string} name
   * Unique name of the resource.
   * @returns {Resource}
   */
  resource (name) {
    return this.#resources.get(name)
  }

  /**
   * Remove resources. This accepts any number of string arguments,
   * where each string represents the unique name of a system resource,
   * asset, or component.
   * @param {String[]} resourceName
   */
  removeResource () {
    this.#resources.delete(...(arguments.length > 0 ? arguments : this.resources))
  }

  /**
   * Create a new system role.
   *
   * *Example*
   *
   * ```
   * IAM.createRole('admin', {
   *   blog: 'allow:*',
   *   superAdminSection: ['read', 'deny:create']
   * })
   * ```
   *
   * @param {string} name
   * The name of the role.
   * @param [Object] permissions
   * The resource/right(s) assigned to the role.
   * @return {Role|Role[]}
   * Returns a role, or an array of roles if an object containing one or more
   * roles was configured.
   */
  createRole (name, permissions) {
    return this.#roles.create(...arguments)
  }

  /**
   * @property {Resource[]} roles
   * An array of roles within the IAM system.
   */
  get roles () {
    return this.#roles.items
  }

  /**
   * @property {String[]} roleList
   * An array of role _names_ within the IAM system.
   */
  get roleList () {
    return this.#roles.list
  }

  /**
   * Retrieve a role by name.
   * @param {string} name
   * Unique name of the role.
   * @returns {Resource}
   */
  role (name) {
    return this.#roles.get(name)
  }

  /**
   * Remove roles. This accepts any number of string arguments,
   * where each string represents the unique name of a system role
   * (or the role object itself).
   * @param {String[]|Role[]} role
   */
  removeRole () {
    const args = (arguments.length > 0 ? Array.from(arguments) : this.roles).filter(a => {
      if (typeof a === 'string') {
        return a.trim().toLowerCase() !== 'everyone'
      } else if (a instanceof Role) {
        return a.OID !== Symbol.for('everyone')
      }

      return false
    })

    if (args.length > 0) {
      this.#roles.delete(...args)
    }
  }

  /**
   * Create a new system user.
   *
   * *Example*
   *
   * ```
   * const userA = IAM.createUser() // No role assignments
   * const userB = IAM.createUser('blog', 'admin') // Two role assignments
   * const users = IAM.createUser({
   *   name: 'Other User 1',
   *   description: 'Basic user',
   *   roles: 'blog'
   * }, {
   *   name: 'Other User 2',
   *   description: 'Another user',
   *   roles: ['blog', 'admin']
   * })
   * ```
   * @param {Role|String|Object} roles
   * The role(s) assigned to the user.
   * This can be a Role instance, name of a role, or an object.
   * When an object is specfied, the `role` attribute will be used
   * to assign roles. All other attributes will be used as
   * configuration propertied.
   * @return {User|User[]}
   * Returns a role, or an array of roles if an object containing one or more
   * roles was configured.
   */
  createUser (roles) {
    if (arguments.length === 0) {
      return this.#users.create()
    }

    const results = []

    const args = Array.from(arguments).filter(role => {
      if (typeof role === 'object') {
        const user = this.#users.create(...(role.roles || []))

        delete role.role

        for (const [key, value] of Object.entries(role)) {
          if (user[key] !== undefined) {
            user[key] = value
          }
        }

        results.push(user)
        return false
      }

      return true
    })

    if (args.length > 0) {
      results.push(this.#users.create(...args))
    }

    return arguments.length === 1 ? results[0] : results
  }

  /**
   * @property {User[]} users
   * An array of users within the IAM system.
   */
  get users () {
    return this.#users.items
  }

  /**
   * @property {String[]} userList
   * An array of user _names_ within the IAM system.
   */
  get userList () {
    return this.#users.list
  }

  /**
   * Retrieve a user by name.
   * @param {string} name
   * Unique user of the system.
   * @returns {User}
   */
  user (name) {
    return this.#users.get(name)
  }

  /**
   * Remove roles. This accepts any number of string arguments,
   * where each string represents the unique name of a system role
   * (or the role object itself).
   * @param {String[]|Role[]} role
   */
  removeUser () {
    const args = (arguments.length > 0 ? Array.from(arguments) : this.users)
    this.#users.delete(...args)
  }

  /**
   * Assigns resource rights to all users. Internally, this modifies the rights
   * of a reserved role: `everyone`.
   * @param  {Object} [acl={}]
   */
  everyone (acl = {}) {
    const role = this.role('everyone')

    if (role) {
      if (acl !== null && typeof acl === 'object' && Object.keys(acl).length > 0) {
        for (let [resource, rights] of Object.entries(acl)) {
          rights = Array.isArray(rights) ? rights : [rights]
          role.assignRights(resource, ...rights)
        }
      } else {
        role.revokeRights()
      }
    }
  }

  all () {
    const location = (new Error()).stack.split('\n').slice(1, 2).join('').trim()
    console.warn('IAM.all() is deprecated. Use IAM.everyone() instead ' + location)
    this.everyone(...arguments)
  }

  /**
   * Create new groups. This accepts any number of string arguments,
   * where each string represents the unique name of a system group.
   * @param  {string|object} name
   * The name of the group. This can also be an object containing multiple
   * groups.
   * @return {Group|Group[]}
   * Returns a group, or an array of groups if more than one is specified.
   */
  createGroup () {
    const result = []
    for (const group of arguments) {
      if (!this.group(group)) {
        result.push(this.#groups.create(group))
      }
    }

    if (result.length === 0) {
      return null
    }

    return arguments.length === 1 ? result[0] : result
  }

  /**
   * @property {Group[]} groups
   * An array of groups within the IAM system.
   */
  get groups () {
    return this.#groups.items
  }

  /**
   * @property {String[]} groupList
   * An array of group _names_ within the IAM system.
   */
  get groupList () {
    return this.#groups.list
  }

  /**
   * Retrieve a group by name.
   * @param {string} name
   * Unique name of the group.
   * @returns {Group}
   */
  group (name) {
    return this.#groups.get(name)
  }

  /**
   * Remove groups. This accepts any number of string arguments,
   * where each string represents the unique name of a system group.
   * @param {String[]} resourceName
   */
  removeGroup () {
    this.#resources.delete(...(arguments.length > 0 ? arguments : this.groups))
  }

  /**
   * Determine whether a user is allowed to use a
   * resource with the specified right/permission.
   *
   * ```
   * IAM.authorized(IAM.currentUser, 'portal', 'view')
   *
   * // Any number of rights/permissions can be supplied:
   * IAM.authorized(IAM.currentUser, 'portal', 'create', 'update')
   *
   * // Alternative option
   * IAM.currentUser.authorized('portal', 'create')
   * const user = new User()
   * ...add groups/roles...
   * user.authorized('portal', 'create')
   * ```
   * @param  {IAM.User} user
   * An IAM.User object representing the user.
   * @param  {String}  [resource='']
   * The IAM resource for which user access should be determined.
   * @param  {String}  [right='']
   * The right/permission(s) the user must have to be considered "authorized".
   * @return {Boolean}
   */
  authorized (user) {
    if (!(user instanceof User)) {
      throw new Error('Must supply a valid IAM User instance.')
    }

    return user.authorized(...Array.from(arguments).slice(1))
  }

  isUserAuthorized () {
    console.warn('`isUserAuthorized` is deprecated. Use `authorized` instead.')
    return this.authorized(...arguments)
  }

  reset (config) {
    this.#resources.reset()
    this.#users.reset()
    this.#groups.reset()
    this.#currentUser = null
    this.#id = new Map()

    const everyone = this.role('everyone')
    everyone.reset()

    this.#roles.reset()
    this.#roles.add(everyone)

    if (config) {
      this.load(config)
    }
  }

  load (cfg = null) {
    if (!cfg || typeof cfg !== 'object') {
      throw new Error('No configuration supplied.')
    }

    this.reset()

    this.name = cfg.name || this.name
    this.description = cfg.description || this.description

    if (cfg.resources) {
      for (const resource of cfg.resources) {
        const r = this.createResource(resource.name, resource.rights)
        r.description = resource.description || ''
      }
    }

    if (cfg.roles) {
      for (const role of cfg.roles) {
        if (role.name && role.rights) {
          if (role.name === 'everyone') {
            this.everyone(role.rights)
          } else {
            const r = this.createRole(role.name, role.rights)
            if (role.description) {
              r.description = role.description
            }
          }
        }
      }
    }

    if (cfg.groups) {
      // Create all known groups & identify those with subgroups
      const parents = new Set()
      for (const group of cfg.groups) {
        if (group.name) {
          const g = this.createGroup(group.name)

          if (group.description) {
            g.description = group.description
          }

          if (Array.isArray(group.roles)) {
            group.roles.forEach(r => g.assign(r.name ? r.name : r))
          }

          if (Array.isArray(group.members) && group.members.filter(m => m.type === 'group').length > 0) {
            parents.add(g)
          }
        }
      }

      // Create subgroup associations
      for (const parent of parents) {
        for (const subgroup of parent.members.filter(m => m.type === 'group')) {
          console.log(parent)
          parent.add(subgroup)
        }
      }
    }

    if (cfg.users) {
      for (const user of cfg.users) {
        user.roles = Array.isArray(user.roles) ? user.roles : []

        const u = this.createUser(...user.roles)

        if (user.name) {
          u.name = user.name
        }

        if (user.description) {
          u.description = user.description
        }

        if (Array.isArray(user.groups)) {
          u.join(...user.groups)
        }

        if (typeof user.rights === 'object') {
          u.setRight(user.rights)
        }
      }
    }
  }
}

globalThis[REGISTRY_ID] = new Registry()

export const IAM = globalThis[REGISTRY_ID]

export { IAM as default }
