import User from './lib/user.js'
import Group from './lib/group.js'

class Manager {
  // Map of Set objects. Each set represents the actions
  // associated with the resource.
  #resources = new Map()

  // Stores the known roles.
  #roles = new Map()

  // Map of resources to roles.
  #roleMap = new Map()

  #forceArray = function () {
    if (arguments.length > 1) {
      return Array.from(arguments)
    }

    if (!Array.isArray(arguments[0])) {
      return [arguments[0]]
    }

    return arguments[0]
  }

  // Placeholders for registering users and groups.
  #groups = new Map()
  #groupMap = new Map()
  #users = new Set()

  constructor () {
    this.createRole('everyone', {})

    Object.defineProperties(this, {
      getRoleRights: {
        enumerable: false,
        configurable: false,
        writable: false,
        value: (role, resource = null) => {
          return resource === null ? this.#roles.get(role) : (this.#roles.get(role)[resource] || [])
        }
      }
    })
  }

  // Private method to keep track of users.
  registerUser (user) {
    this.#users.add(Object.defineProperty({}, 'user', {
      get: () => user
    }))
  }

  // Private method to keep track of groups.
  registerGroup (group) {
    this.#groups.set(group.name, group)
    this.#groupMap.set(group.OID, group.name)
  }

  /**
   * A JSON/object representation of the IAM resources
   * @return {object}
   */
  get resources () {
    let data = {}
    this.#resources.forEach((actions, resource) => data[resource] = Array.from(actions))

    return data
  }

  /**
   * A JSON/object representation of the registered IAM roles.
   * @return {object}
   */
  get roles () {
    let data = {}

    this.#roles.forEach((rights, role) => {
      let resources = {}

      Object.keys(rights).forEach(resource => resources[resource] = Array.from(rights[resource]))

      data[role] = resources
    })

    return data
  }

  get map () {
    return this.#roleMap
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
    if (typeof name === 'object') {
      Object.keys(name).forEach(resource => this.#resources.set(resource, new Set([...this.#resources.get(resource) || [], ...name[resource]])))
    } else {
      this.#resources.set(name, new Set([...this.#resources.get(name) || [], ...rights]))
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
    Object.keys(rights).forEach(resource => {
      if (!this.#resources.has(resource.trim())) {
        throw new Error(`${resource.trim()} is not a recognized IAM system resource.`)
      }

      rights[resource] = new Set([...this.#forceArray(rights[resource])])

      this.#roleMap.set(resource, (this.#roleMap.get(resource) || new Set()).add(name))
    })

    this.#roles.set(name.trim(), rights)
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

    let allowed = false
    let rights = this.#resources.get(resource)

    if (!rights.has(right) && right !== '*') {
      return false
    }

    for (let role of this.#roleMap.get(resource)) {
      if (user.of(role)) {
        let permissions = (this.#roles.get(role) || {})[resource]

        if (permissions.has('allow:*') || permissions.has(`allow:${right}`)) {
          return true
        }

        if (permissions.has(`deny:${right}`)) {
          return false
        }

        if (permissions.has(right) || permissions.has('*')) {
          allowed = true
        }
      }
    }

    return allowed
  }

  getResourceRights (resource) {
    return this.#resources.get(resource) || []
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

const IAM = new Manager()

export { IAM as default, User, Group }
