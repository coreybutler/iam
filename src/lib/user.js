import IAM from '../main.js'

export default class User {
  #roles = new Set()
  #oid = Symbol('user')
  #name = null
  #memberOf = new Set()

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
    }))

    this.#roles = new Set([...['everyone'], ...roles])

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
          this.#memberOf.delete(group)
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

  get roles () {
    let roles = new Set([...this.#roles])

    this.#memberOf.forEach(group => {
      roles = new Set([...roles, ...IAM.getGroup(group).roles])
    })

    return Array.from(roles)
  }

  get rights () {
    let iamRoles = IAM.roles
    let data = {}

    // Combine permissions from all roles
    Array.from(this.#roles).forEach(role => {
      Object.keys(iamRoles[role]).forEach(resource => {
        data[resource] = new Set([...(data[resource] || []), ...iamRoles[role][resource]])
      })
    })

    // Iterate through resources to clear denied rights
    for (let [resource, rights] of Object.entries(data)) {
      let allowed = new Set()
      let denied = new Set()

      rights = new Set(Array.from(rights).map(right => {
        if (right.indexOf('allow:') >= 0) {
          allowed.add(right.substring(6).trim())
        } else if (right.indexOf('deny:') >= 0) {
          denied.add(right.substring(5).trim())
        }

        return right.substring(right.indexOf(':') < 0 ? 0 : right.indexOf(':') + 1)
      }))

      // Loop through all the denied rights and remove them.
      denied.forEach(right => !allowed.has(right) && rights.delete(right))

      // If the right is "all" (*), replace it with the known resource rights.
      if (rights.has('*')) {
        rights = new Set([...IAM.getResourceRights(resource)])
      }

      data[resource] = Array.from(rights)
    }

    return data
  }

  get groups () {
    return Array.from(this.#memberOf).map(oid => IAM.getGroup(oid).name)
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
    if (this.#roles.has(role.trim())) {
      return true
    }

    if (this.#memberOf.size > 0) {
      return (new Set([...this.roles])).has(role.trim())
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
   * @param  {string} name
   * Name of the role. This can also be a comma separated list (multiargument).
   */
  assign () {
    Array.from(arguments).forEach(role => this.#roles.add(role.trim()))

    return this
  }

  /**
   * Unassign user from new role.
   * @param  {string} role
   * Name of the role. This can also be a comma separated list (multiargument).
   */
  revoke () {
    Array.from(arguments).forEach(role => {
      if (role.trim().toUpperCase() === 'EVERYONE') {
        throw new Error('Cannot deny the "${role}" role for users.')
      }

      this.#roles.delete(role.trim())
    })

    return this
  }

  /**
   * Clear the user of all roles (except the `everyone` role)
   * @return {[type]} [description]
   */
  clear () {
    this.#roles = new Set(['everyone'])

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
   */
  join () {
    Array.from(arguments).forEach(group => IAM.assignUserGroup(this, group))
    return this
  }

  leave () {
    Array.from(arguments).forEach(group => IAM.removeUserGroup(this, group))
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
   * @return {Object}
   *
   */
  trace (resource, right) {
    // Get relevant roles directly assigned to the user
    for (let role of this.#roles) {
      for (let perm of IAM.getRoleRights(role, resource)) {
        let permission = (new RegExp(`((allow|deny)\\:)?(${right}|\\*)`, 'i')).exec(perm)

        if (permission !== null) {
          if (permission[2] === 'allow') {
            return {
              type: 'role',
              resource,
              right,
              group: null,
              role,
              allowed: true,
              lineage: `${role} (role) --> ${right} (permission)`
            }
          }
        }
      }
    }

    // Get roles assigned to the user via a group
    for (let group of this.#memberOf) {
      console.log('-->', IAM.getGroup(group).trace(resource, right))
    }

    return null
  }

  /**
   * A summary of user data.
   * @return {object}
   */
  get summary () {
    let data = {
      name: this.#name,
      roles: this.roles,
      rights: this.rights,
      groups: this.groups
    }

    return data
  }
}
