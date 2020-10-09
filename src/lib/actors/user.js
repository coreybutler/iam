import Trace from '../trace.js'
import { REGISTRY_ID, getRole, getResource, getGroup } from '../utilities.js'

/**
 * Represents a user of the system.
 */
export default class User extends Trace {
  #roles = new Set()
  #memberOf = new Set() // group membership
  #active = true

  /**
   * @constructor
   * Supply any number of string arguments to the
   * constructor. Each string represents the name of
   * an existing IAM.Role to be assigned to the user.
   */
  constructor () {
    super({ type: 'user' })

    this.#roles.add(getRole('everyone', true))

    for (let role of arguments) {
      role = getRole(role, true)

      if (role) {
        this.#roles.add(role)
      }
    }

    Object.defineProperties(this, {
      /**
       * @property {Set} aggregateRoles
       * A set of roles associated with the user.
       * This includes rights inherited from group membership.
       * @private
       */
      aggregateRoles: {
        get () {
          if (!this.#active) {
            return new Set()
          }

          const roles = this.#roles

          for (const group of this.#memberOf) {
            for (const role of group.permissions) {
              roles.add(role)
            }
          }

          return roles
        }
      }
    })

    this.register()
  }

  get data () {
    return Object.assign({}, super.data, {
      roles: this.roleList.filter(i => i !== 'everyone'),
      groups: this.groupList
    })
  }

  get roles () {
    return Array.from(this.#roles)
  }

  get roleList () {
    return Array.from(this.#roles).map(r => r.name)
  }

  get roleNames () {
    console.warn('User.roleNames is deprecated. Use User.roleList instead.')
    return this.roleList
  }

  get groups () {
    return Array.from(this.#memberOf)
  }

  get groupList () {
    return this.groups.map(g => g.name)
  }

  /**
   * @property {boolean}
   * Indicates the user is disabled.
   */
  get disabled () {
    return !this.#active
  }

  /**
   * Disable the user. This forces the `authorized()` method to always return false.
   */
  disable () {
    this.#active = false
  }

  /**
   * Enable the user. The `authorized()` method will respect all roles/groups/rights
   * associated with the user.
   */
  enable () {
    this.#active = true
  }

  /**
   * Join a group/s. This method will take any number
   * of valid strings (group name) or `Group` objects as arguments.
   * @chainable
   * @return {User}
   */
  join () {
    for (let group of arguments) {
      group = typeof group === 'string' ? group : group.name
      group = getGroup(group, true)

      if (!this.#memberOf.has(group)) {
        this.#memberOf.add(group)
        this.emit('group.join', group)
      }

      if (!group.has(this)) {
        group.add(this)
      }
    }

    return this
  }

  /**
   * Leave a group/s. This method will take any number
   * of valid strings (group name) or `Group` objects as arguments.
   * @chainable
   * @return {User}
   */
  leave () {
    for (let group of arguments) {
      group = typeof group === 'string' ? group : group.name
      group = getGroup(group)

      if (group) {
        if (group.has(this)) {
          group.remove(this)
        }

        this.#memberOf.delete(group)
        this.emit('group.leave', group)
      }
    }

    return this
  }

  /**
   * Assign user a new role.
   * @param  {string|Role} name
   * Name of the role (or instance of `Role`). This can also be a comma separated list (multiargument).
   * @chainable
   * @return {User}
   */
  assign () {
    for (let role of arguments) {
      role = getRole(role, true)

      if (role && !this.#roles.has(role)) {
        this.#roles.add(role)
        this.emit('role.assign', role)
      }
    }
  }

  /**
   * Revoke role from user.
   * @param  {string|Role} name
   * Name of the role (or instance of `Role`). This can also be a comma separated list (multiargument).
   * @chainable
   * @return {User}
   */
  revoke () {
    for (let role of arguments) {
      role = getRole(role)

      if (role && this.#roles.has(role)) {
        this.#roles.delete(role)
        this.emit('role.revoke', role)
      }
    }
  }

  /**
   * Determines whether the user is a member of the specified group.
   * @param {string|Group} group
   * The name of a group or the `Group` instance.
   * @return {boolean}
   */
  memberOf (group) {
    group = globalThis[REGISTRY_ID].group(group)

    return group ? this.#memberOf.has(group) : false
  }

  /**
   * Determines whether the user is assignd to
   * the specified role. There is an alias for this
   * called `assignedTo()`.
   * @param  {string} role
   * The name of the role.
   * @return {boolean}
   */
  of (role) {
    role = getRole(role)

    if (role && role.OID === Symbol.for('everyone')) {
      return true
    }

    if (this.#roles.has(role)) {
      return true
    }

    for (const group of this.#memberOf.entries()) {
      if (group.permitted(role)) {
        return true
      }
    }

    return false
  }

  /**
   * @alias of
   */
  assignedTo () {
    return this.of(...arguments)
  }

  /**
   * Destroy relations to the user.
   */
  destroy () {
    for (const group of this.#memberOf.entries()) {
      group.remove(this)
    }

    super.destroy()
  }

  authorized (resource) {
    if (!this.#active) {
      return false
    }

    resource = getResource(resource)

    if (resource === null) {
      return false
    }

    const resourceRights = new Set(resource.rights.map(r => r.name))
    const permissions = new Set(Array.from(arguments).slice(1))

    if (permissions.has('*')) {
      throw new Error('Invalid right: Cannot authorize a wildcard (*). Please use a named right/permission, such as "create" or "delete".')
    }

    const rights = Array.from(this.aggregateRoles)
      .filter(role => role.appliesToResource(resource))
      .reduce((agg, role) => {
        for (const right of role.rights[resource.name]) {
          agg.add(right)
        }

        return agg
      }, new Set())

    if (rights.length === 0) {
      return false
    }

    const result = {}

    // Iterate through requested permissions
    for (const permission of permissions) {
      // Assure the permission is defined
      if (!resourceRights.has(permission)) {
        throw new Error(`Invalid right/permission: "${permission}" is not a right/permission option of the "${resource.name}" resource.`)
      }

      // Iterate through the user roles applicable to resource
      const relevantRights = Array.from(rights).filter(r => r.name === permission || r.all)
      for (const right of relevantRights) {
        if (permissions.has(right)) {
          return false
        }

        const current = result[permission]
        if (!current || (!current.forced && right.allowed) || (!right.forced && right.allowed)) {
          result[permission] = right
        }
      }
    }

    const preResult = Object.values(result)
    return preResult.length === 0 ? false : preResult.filter(r => !r.allowed).length === 0
  }

  /**
   * Trace the lineage of a right/permission, back to the source.
   * This is useful for answering questions like "what group
   * granted or denied a particular permission?"
   * @param  {string|Resource} resource
   * Resource name.
   * @param  {string|Right} right
   * Permission/right.
   * @return {Lineage}
   */
  trace (resource, right) {
    return super.trace(resource, right, { items: Array.from(this.#roles) }, this.#memberOf)
  }
}

// TODO: trace lineage
