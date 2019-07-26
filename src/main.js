import User from './lib/user.js'
import Group from './lib/group.js'
import Role from './lib/role.js'
import Resource from './lib/resource.js'

class Manager {
  // Map of Set objects. Each set represents the actions
  // associated with the resource.
  #resources = new Map()

  // Stores the known roles.
  #roles = new Map()
  #roleMap = new Map()

  // Placeholders for registering users and groups.
  #groups = new Map()
  #groupMap = new Map()
  #users = new Set()

  constructor () {
    Object.defineProperties(this, {
      getRoleRights: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: (role, resource = null) => {
          return resource === null ? this.#roles.get(role) : (this.#roles.get(role)[resource] || [])
        }
      },

      getRole: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: role => {
          if (typeof role === 'symbol') {
            return this.#roleMap.get(role)
          }

          return this.#roles.get(role instanceof Role ? role.name : role)
        }
      },

      // Private method to keep track of users.
      registerUser: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: user => {
          this.#users.add(Object.defineProperty({}, 'user', {
            get: () => user
          }))
        }
      },

      // Private method to keep track of groups.
      registerGroup: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: group => {
          this.#groups.set(group.name, group)
          this.#groupMap.set(group.OID, group.name)
        }
      },

      registerRole: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: role => {
          this.#roles.set(role.name, role)
          this.#roleMap.set(role.OID, role)
        }
      }
    })
  }

  /**
   * @property {Map}
   * A representation of the IAM resources.
   */
  get resources () {
    return new Map([...this.#resources])
  }

  get resourceNames () {
    return Array.from(this.#resources.keys()).sort()
  }

  /**
   * @property {Map}
   * A representation of the IAM roles.
   */
  get roles () {
    return new Map([...this.#roles])
  }

  get roleNames () {
    return Array.from(this.#roles.keys()).sort()
  }

  get User () {
    return User
  }

  /**
   * IAM.User objects associated with the manager.
   * @return {IAM.User[]}
   */
  get users () {
    return Array.from(this.#users).map(user => user.user)
  }

  /**
   * A list of user names.
   * @return {string[]}
   */
  get userlist () {
    return this.users.map(user => user.name)
  }

  /**
   * IAM.Group objects associated with the manager.
   * @return {IAM.Group[]}
   */
  get groups () {
    return Array.from(this.#groups.entries())
  }

  /**
   * A list of group names.
   * @return {string[]}
   */
  get grouplist () {
    return Array.from(this.#groups.keys())
  }

  get configuration () {
    return {
      resources: Object.fromEntries(this.#resources),
      roles: Object.fromEntries(this.#roles),
      groups: Object.fromEntries(this.#groups)
    }
  }

  /**
   * Indicates a role exists in the manager.
   * @param  {string} role
   * The name of the role.
   * @return {boolean}
   */
  roleExists (role) {
    return this.#roles.has(role.trim())
  }

  /**
   * Create new resources. This accepts any number of string arguments,
   * where each string represents the unique name of a system resource,
   * asset, or component.
   * @param  {string|object} name
   * The name of the resource. This can also be an object containing multiple
   * resources/rights.
   * @param  {Array}  [rights=['view']]
   * The resource rights that are assigned to this role. By default, `view`
   * is assigned if no other rights are provided.
   */
  createResource (name = null, rights = ['view']) {
    let component

    if (typeof name === 'object') {
      Object.keys(name).forEach(resource => {
        component = new Resource(resource, ...name[resource])
        this.#resources.set(component.name, component)
      })
    } else {
      component = new Resource(name, ...rights)
      this.#resources.set(name, component)
    }
  }

  /**
   * Remove resources. This accepts any number of string arguments,
   * where each string represents the unique name of a system resource,
   * asset, or component.
   */
  removeResource () {
    Array.from(arguments).forEach(resource => this.#resources.delete(resource))
  }

  /**
   * Remove all known resources.
   */
  clearResources () {
    this.#resources = new Map()
  }

  /**
   * Create a new IAM role.
   * @param  {string} name
   * Unique name of the role. If the role already exists, it will
   * be overwritten.
   * @param  {Object} [rights={}]
   * Specify rights granted to the role, by resource.
   * To explicitly deny a right, preface it with `deny:`.
   * To explicitly force/allow a right, preface it with `allow:`.
   *
   * For example:
   * ```
   * IAM.createRole('admin', {
   *   'user admin': ['read', 'write'],
   *   'user portal': ['read', 'deny:write']
   * })
   * ```
   *
   * _Note_: It is rare to explicitly force a right to be granted.
   * The most common use case for forcibly granting a right is when a user
   * is also assigned to another role which explicitly denies the right.
   */
  createRole (name, rights = {}) {
    let role = new Role(name)

    Object.keys(rights).forEach(resource => {
      if (!this.#resources.has(resource.trim())) {
        throw new Error(`${resource.trim()} is not a recognized IAM system resource.`)
      }

      role.assignRights(resource, rights[resource])
    })

    this.#roles.set(role.name, role)
  }

  roleExists (role) {
    return this.#roles.has(role)
  }

  /**
   * Remove roles from the IAM. Multiple roles can be removed simultaneously.
   * This method automatically updates any known groups which may be affected
   * by this operation.
   * ```
   * IAM.removeRole('user admin', 'user portal')
   * ```
   */
  deleteRole () {
    Array.from(arguments).forEach(role => {
      this.#roles.delete(role.trim())
    })

    this.#groups.forEach(group => {
      let grp = this.#groups.get(group)
      grp.removeRole(...arguments)

      this.#groups.set(group, grp)
    })
  }

  /**
   * Assigns resource rights to all users. Internally, this modifies the rights
   * of a reserved role name called `everyone`.
   * @param  {Object} [acl={}]
   * @return {[type]}          [description]
   */
  all (acl = {}) {
    this.deleteRole('everyone')

    if (acl !== null && typeof acl === 'object') {
      this.createRole('everyone', acl)
    }
  }

  /**
   * Determine whether a user is allowed to use a
   * resource with the specified right/permission.
   * @param  {IAM.User} user
   * An IAM.User object representing the user.
   * @param  {String}  [resource='']
   * The IAM resource for which user access should be determined.
   * @param  {String}  [right='']
   * The right/permission the user must have to be considered "authorized".
   * @return {Boolean}
   */
  isUserAuthorized (user, resource = '', right = '') {
    right = right.trim() === '' ? '*' : right.trim()

    if (!(user instanceof User)) {
      throw new Error('Invalid IAM.User specified.')
    }

    if (!this.#resources.has(resource.trim())) {
      throw new Error(`${resource.trim()} is not a recognized IAM resource.`)
    }

    let rights = this.#resources.get(resource).rights

    if (!rights.has(right) && right !== '*') {
      return false
    }

    for (let role of user.permissions) {
      if (role.authorized(resource, right)) {
        return true
      }
    }
// console.error(user.roles)
    // for (let role of this.#roleMap.get(resource)) {
    //   if (user.of(role)) {
    //     let permissions = (this.#roles.get(role) || {})[resource]
    //
    //     if (permissions.has('allow:*') || permissions.has(`allow:${right}`)) {
    //       return true
    //     }
    //
    //     if (permissions.has(`deny:${right}`)) {
    //       return false
    //     }
    //
    //     if (permissions.has(right) || permissions.has('*')) {
    //       allowed = true
    //     }
    //   }
    // }

    return false
  }

  getResourceRights (resource) {
    return this.#resources.get(resource) || []
  }

  getResource (name) {
    return this.#resources.get(name)
  }

  /**
   * Create a new IAM.Group with a unique name.
   * @return {IAM.Group|array}
   * Returns an IAM group if only one new group is created.
   * Returns an array of IAM groups if more than one new group is created.
   */
  createGroup () {
    Array.from(arguments).forEach(name => {
      let group = new Group(name)
      this.#groups.set(name, group)
    })

    if (arguments.length === 1) {
      return Array.from(this.#groups.values())[0]
    }

    return Array.from(this.#groups.values())
  }

  /**
   * Remove one or more groups from the manager.
   */
  removeGroup () {
    Array.from(arguments).forEach(name => {
      let group = this.#groups.get(name)

      if (group) {
        group.clearMembers()
      }

      this.#groups.delete(name)
    })
  }

  /**
   * Assign a user to a group.
   * @param  {IAM.User} user
   * The user to assign to the group.
   * @param  {string|IAM.Group} groupName
   * The name of the group to assign the user to.
   * Any number of groups can be added at the same time by adding additional
   * group names as arguments to the function (i.e. `assugnUserGroup(userObject, 'grp1', 'grp2', 'etc')`).
   */
  assignUserGroup (user, group) {
    Array.from(arguments).forEach((group, i) => {
      if (i > 0) { // Skip the first argument, which is the user object.
        let grp = this.#groups.get(group instanceof Group ? group.name : group)

        if (!grp) {
          throw new Error(`Could not assign user to "${name}". The group is not recognized/registered with the IAM system.`)
        }

        grp.addMember(user)
      }
    })
  }

  /**
   * Remove a user from a group.
   * @param  {IAM.User} user
   * The user to remove from the group.
   * @param  {string|IAM.Group} groupName
   * The name of the group to remove the user from.
   * Any number of groups can be removed at the same time by adding additional
   * group names/objects as arguments to the function (i.e. `assugnUserGroup(userObject, 'grp1', 'grp2', 'etc')`).
   */
  removeUserGroup (user, group) {
    Array.from(arguments).forEach((group, i) => {
      if (i > 0) { // Skip the first argument, which is the user object.
        let grp = this.#groups.get(group instanceof IAM.Group ? group.name : group)

        if (!grp) {
          throw new Error(`Could not assign user to "${name}". The group is not recognized/registered with the IAM system.`)
        }

        grp.removeMember(user)
      }
    })
  }

  /**
   * Indicates whether the group exists or not.
   * @param  {string} name
   * Name of the group.
   * @return {boolean}
   */
  groupExists (name) {
    return this.#groups.has(name.trim())
  }

  /**
   * Get a named group.
   * @param  {string} name
   * Name of the group to return.
   * @return {IAM.Group}
   * Returns `null` if the group is unrecognized.
   */
  getGroup (name) {
    return typeof name === 'symbol'
      ? this.#groups.get(this.#groupMap.get(name))
      : this.#groups.get(name)
  }
}

const manager = new Manager()

manager.createRole('everyone', {})

export { manager as default, User, Group }
