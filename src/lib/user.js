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
    return Array.from(this.permissions)
  }

  get roleNames () {
    return this.roles.map(role => role.name)
  }

  get permissions () {
    let roles = new Set([...this.#roles])

    this.#memberOf.forEach(group => {
      roles = new Set([...roles, ...IAM.getGroup(group).permissions])
    })

    return new Set([...Array.from(roles).map(role => IAM.getRole(role))])
  }

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
          permissions.forEach(permission => data.set(resource, data.get(resource).delete(permission)))
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
    role = typeof role === 'symbol' ? role : (role instanceof Role ? role.OID : IAM.getRole(role)).OID

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
   */
  revoke () {
    Array.from(arguments).forEach(role => {
      if (role.trim().toLowerCase() === 'everyone') {
        throw new Error('Cannot revoke the "everyone" role.')
      }

      this.#roles.delete(IAM.getRole(role.trim()).OID)
    })

    return this
  }

  /**
   * Clear the user of all roles (except the `everyone` role)
   * @return {[type]} [description]
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
    let data = {
      type: 'role',
      role: null,
      group: null,
      resource,
      right,
      allowed: false,
      lineage: null
    }

    // Get relevant roles directly assigned to the user
    for (let role of Array.from(this.#roles).map(role => IAM.getRole(role))) {
      let permissions = role.rights.get(resource)

      if (permissions) {
        for (let permission of permissions) {
          if (permission.forced) {
            return Object.assign(data,{
              role,
              allowed: true,
              lineage: `${role.name} (role) --> ${RIGHTS} (right)`
            })
          } else if (permission.denied) {
            data = Object.assign(data, {
              role,
              allowed: false,
              lineage: `${role.name} (role) --> ${right} (right)`
            })
          } else if (permission.is(right) && !data.hasOwnProperty('role')) {
            data = Object.assign(data, {
              role,
              allowed: true,
              lineage: `${role.name} (role) --> ${right} (right)`
            })
          }
        }
      }
    }

    // Get roles assigned to the user via a group
    for (let group of this.#memberOf) {
      let lineage = IAM.getGroup(group).trace(...arguments)

      if (lineage !== null && (!data.hasOwnProperty('role') || lineage.forced || !data.allowed)) {
        data = data || lineage
        data.lineage = lineage.lineage
        data.group = lineage.group
        data.role = lineage.role
        data.allowed = lineage.allowed

        if (lineage.forced) {
          return data
        }
      }
    }

    return data.lineage !== null ? data : null
  }

  lineage(resource, right) {
    let lineage = this.trace(...arguments)

    return lineage.lineage.split(/\s+?\-+\>\s+?/i).map(source => {
      // Get group
      if (/\((.+)?group\)/i.test(source)) {
        return IAM.getGroup(source.replace(/\((.+)?group\)/gi, '').trim())
      } else if (/\(role\)/i.test(source)) {
        return IAM.getRole(source.replace(/\(.+\)/gi, '').trim())
      }

      return source
    })
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
