import IAM from '../main.js'
import Role from './role.js'
import Lineage from './lineage.js'

/**
 * @class IAM.User
 * Represents a user of the IAM system.
 * Users are assigned roles. Users may also be
 * assigned _to_ groups. All group memberships
 * apply to users as long as they are a member
 * of the group.
 */
export default class User {
  #roles = new Set()
  #oid = Symbol('user')
  #name = null
  #memberOf = new Set()

  /**
   * @constructor
   * Supply any number of string arguments to the
   * constructor. Each string represents the name of
   * an existing IAM.Role to be assigned to the user.
   */
  constructor () {
    let roles = new Set(Array.from(arguments).map(name => name.trim()).filter(name => {
      name = name.trim()

      let exists = IAM.roleExists(name)

      if (!exists) {
        throw new Error(`"${name}" is not a recognized IAM role.`)
      }

      if (name.toLowerCase() === 'everyone') {
        return false
      }

      return exists
    }).map(name => IAM.getRole(name).OID))

    this.#roles = new Set([...[IAM.getRole('everyone').OID], ...roles])

    Object.defineProperties(this, {
      addMembership: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: group => {
          this.#memberOf.add(group)
        }
      },
      removeMembership: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: group => {
          this.#memberOf.delete(IAM.getGroup(group).OID)
        }
      },
      groupRoles: {
        enumerable: false,
        get: () => Array.from(this.#memberOf).map(oid => IAM.getGroup(oid).roles)
      }
    })

    IAM.registerUser(this)
  }

  /**
   * A descriptive name to identify the user.
   * This is not necessarily a person's name,
   * it is merely a label.
   */
  get name () {
    return this.#name || 'Unknown'
  }

  set name (value) {
    this.#name = value.toString().trim()
  }

  /**
   * @property {IAM.Role[]} roles
   * The roles assigned to the user. This includes
   * and roles inherited from group membership.
   */
  get roles () {
    return Array.from(this.permissions)
  }

  /**
   * @property {string[]} roleNames
   * The names of the roles associated with the user.
   * This includes roles inherited from group membership.
   */
  get roleNames () {
    return this.roles.map(role => role.name)
  }

  /**
   * @property {Set} permissions
   * A set of rights (by resource) associated with the user.
   * This includes rights inherited from group membership.
   * @private
   */
  get permissions () {
    let roles = new Set([...this.#roles])

    this.#memberOf.forEach(group => {
      roles = new Set([...roles, ...IAM.getGroup(group).permissions])
    })

    return new Set([...Array.from(roles).map(role => IAM.getRole(role))])
  }

  /**
   * @property {object} rights
   * An object containing resource names (key) and an array of rights (string values).
   * This represents all of the rights a user has.
   */
  get rights () {
    let roles = new Set([...IAM.roles.values(), ...this.permissions])
    let data = new Map()
    let rights = new Map()

    for (let role of roles) {
      role.resources.forEach((acl, resource) => {
        data.set(resource, new Set())
        rights.set(resource, new Set([...(rights.get(resource) || []), ...acl]))
      })
    }

    for (let [resource, acl] of rights) {
      for (let right of acl) {
        let permissions = right.all ? Array.from(IAM.getResource(resource).rights.keys()) : [right.name]

        if (right.allowed) {
          data.set(resource, new Set([...data.get(resource), ...permissions]))
        } else {
          permissions.forEach(permission => {
            if (data.has(resource)) {
              let record = data.get(resource) || new Map()

              if (record.has(permission)) {
                record.delete(permission)
                data.set(resource, record)
              }
            }
          })
        }

        if (right.force) {
          break
        }
      }
    }

    for (let [resource, acl] of data) {
      data.set(resource, Array.from(acl).sort())
    }

    return Object.fromEntries(data)
  }

  /**
   * @property {IAM.Group[]} groups
   * An array of group object associated with the user.
   */
  get groups () {
    if (this.#memberOf.length === 0) {
      return []
    }

    return Array.from(this.#memberOf).map(oid => IAM.getGroup(oid))
  }

  /**
   * @property {string[]}
   * An array of group names associated with the user.
   */
  get groupNames () {
    if (this.#memberOf.size === 0) {
      return []
    }

    return this.groups.map(group => group.name)
  }

  get data () {
    let data = {
      name: this.#name,
      groups: this.groupNames,
      roles: this.roleNames.filter(role => role.trim().toLowerCase() !== 'everyone')
    }

    return data
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
    if (!role) {
      return false
    }

    if (!IAM.roleExists(role)) {
      return false
    }

    role = typeof role === 'symbol' ? role : (role instanceof Role ? role.OID : (IAM.getRole(role)).OID || null)

    if (typeof role !== 'symbol') {
      throw new (`Invalid role: "${role.toString()}"`)
    }

    if (this.#roles.has(role)) {
      return true
    }

    if (this.#memberOf.size > 0) {
      return (new Set([...this.permissions])).has(role)
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
   * Assign user a new role.
   * @param  {string|IAM.Role} name
   * Name of the role. This can also be a comma separated list (multiargument).
   * @chainable
   * @return {IAM.User}
   */
  assign () {
    Array.from(arguments).forEach(role => {
      this.#roles.add(IAM.getRole(role).OID)
    })

    return this
  }

  /**
   * Unassign user from new role.
   * @param  {string} role
   * Name of the role. This can also be a comma separated list (multiargument).
   * @chainable
   * @return {IAM.User}
   */
  revoke () {
    Array.from(arguments).forEach(role => {
      if (role.trim().toLowerCase() === 'everyone') {
        throw new Error('Cannot revoke the "everyone" role.')
      }

      if (this.of(role)) {
        this.#roles.delete(typeof role === 'symbol' ? role : IAM.getRole(role.trim()).OID)
      }
    })

    return this
  }

  /**
   * Clear the user of all roles (except the `everyone` role)
   * @chainable
   * @return {IAM.User}
   */
  clear () {
    this.#roles = new Set([...IAM.getRole('everyone').OID])

    return this
  }

  /**
   * Determines whether the user is granted access to the
   * specified resource right.
   * @param  {String} resource
   * Name of the resource.
   * @param  {String} [right='*']
   * Name of the right to check for permissions. By default,
   * this method will check for all rights. It will return `false`
   * if the user doesn't have all of the rights specified.
   * It is typically best to specify a single right.
   * @return {boolean}
   */
  authorized (resource = '', right = '*') {
    return IAM.isUserAuthorized(this, ...arguments)
  }

  /**
   * Join a group/s. This method will take any number
   * of valid strings or IAM.Group objects as arguments.
   * @chainable
   * @return {IAM.User}
   */
  join () {
    Array.from(arguments).forEach(group => IAM.assignUserGroup(this, group))
    return this
  }

  /**
   * Remove a user from a group. This method will take any number
   * of valid strings or IAM.Group objects as arguments.
   * @chainable
   * @return {IAM.User}
   */
  leave () {
    Array.from(arguments).forEach(group => IAM.removeGroupMember(group, this))
    return this
  }

  /**
   * Trace the lineage of a right/permission, back to the source.
   * This is useful for answering questions like "what group/role
   * granted or denied a particular permission?"
   * @param  {string} resource
   * Resource name.
   * @param  {string} right
   * Permission/right.
   * @return {IAM.Lineage}
   * A lineage object representing how a right was applied.
   */
  trace (resource, right) {
    let data = new Lineage(...arguments)

    // Get relevant roles directly assigned to the user
    for (let role of Array.from(this.#roles).map(role => IAM.getRole(role))) {
      let permissions = role.rights.get(resource)

      if (permissions) {
        for (let permission of permissions) {
          if (permission.forced) {
            data.role = role
            data.allow(true)
            data.stack = [role, permission]
            return data
          } else if (permission.denied) {
            data.role = role
            data.deny()
            data.stack = [role, permission]
          } else if (permission.is(right) && !data.hasRole) {
            data.role = role
            data.allow()
            data.stack = [role, permission]
          }
        }
      }
    }

    // Get roles assigned to the user via a group
    for (let group of this.#memberOf) {
      let lineage = IAM.getGroup(group).trace(...arguments)

      if (lineage !== null && (!data.hasOwnProperty('role') || lineage.forced || !data.allowed)) {
        data.stack = lineage.stack
        data.group = lineage.group
        data.role = lineage.role

        if (lineage.forced) {
          data.allow(true)
          return data
        }

        if (data.allowed !== lineage.allowed) {
          if (lineage.allowed) {
            data.allow()
          } else {
            data.deny()
          }
        }
      }
    }

    return data.empty ? null : data
  }

  /**
   * A summary of user data.
   * @return {object}
   */
  get summary () {
    let data = {
      name: this.#name,
      roles: Array.from(this.roles).map(role => role.name),
      rights: this.rights,
      groups: this.groups
    }

    return data
  }
}
