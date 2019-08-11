import IAM from '../main.js'
import User from './group.js'
import Lineage from './lineage.js'

/**
 * @class IAM.Group
 * Represents a group of users and groups (groups can be nested).
 */
export default class Group {
  #oid = null
  #name = null
  #members = new Set()
  #memberOf = new Set()
  #subgroups = new Set()
  #roles = new Set()

  constructor (name = 'Unknown Group') {
    this.#name = name
    this.#oid = Symbol(`${this.#name} group`)

    Object.defineProperties(this, {
      addParentGroup: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: group => {
          this.#memberOf.add(group)
          group.addChildGroup(this)
        }
      },
      removeParentGroup: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: group => {
          this.#memberOf.remove(group)
          group.removeChildGroup(this)
        }
      },
      addChildGroup: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: group => {
          this.#subgroups.add(group.OID)
        }
      },
      removeChildGroup: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: group => {
          this.#subgroups.remove(group.OID)
        }
      },
      memberGroups: {
        enumerable: false,
        get () {
          return this.#subgroups
        }
      }
    })

    IAM.registerGroup(this)
  }

  /**
   * @property {Symbol} OID
   * The object ID of the group.
   */
  get OID () {
    return this.#oid
  }

  /**
   * @property {string}
   * The descriptive name
   */
  get name () {
    return this.#name
  }

  /**
   * @property {arry}
   * An array of IAM.User and/or IAM.Group objects
   * whom are members of the group.
   */
  get members () {
    return Array.from(this.#subgroups).map(group => IAM.getGroup(group)).concat(Array.from(this.#members))
  }

  /**
   * @property {string[]}
   * An array of strings where each string represents the name of a user or group
   * whom is a member of the group.
   */
  get memberlist () {
    return this.members.map(member => member.name)
  }

  /**
   * @property {IAM.User[]}
   * An array of IAM.User objects where each user represents a member of the group.
   * This does not include groups. Use #members for a full list, or #subgroups for
   * a list of groups whom are members of the group.
   */
  get users () {
    return Array.from(this.#members)
  }

  /**
   * @property {string[]}
   * An array of user names where each represents a member of the group.
   * This does not include groups. Use #memberlist for a full list, or
   * #subgrouplist for a list of groups whom are members of the group.
   */
  get userlist () {
    return Array.from(this.#members).map(user => user.name)
  }

  /**
   * @property {IAM.Group[]}
   * An array of IAM.Group objects whom this group inherits rights/roles from.
   * These "sub" groups are considered members of the group.
   */
  get subgroups () {
    return Array.from(this.#subgroups).map(group => IAM.getGroup(group))
  }

  /**
   * @property {string[]}
   * An array of group names whom this group inherits rights/roles from.
   * These "sub" groups are considered members of the group.
   */
  get subgrouplist () {
    return Array.from(this.#subgroups).map(group => IAM.getGroup(group).name)
  }

  /**
   * @property {IAM.Role[]} roles
   * Contains all of the roles assigned to the group.
   * Each element of the response is a IAM.Role Object.
   */
  get roles () {
    return Array.from(this.permissions).map(oid => IAM.getRole(oid))
  }

  /**
   * @property {string[]}
   * Contains all of the role names assigned to the group.
   */
  get roleList () {
    return Array.from(this.permissions).map(oid => IAM.getRole(oid).name)
  }

  /**
   * @property {Set} permissions
   * Permissions associated with the group.
   * Each element of the set contains a IAM.Role.OID symbol.
   * @private
   */
  get permissions () {
    let roles = new Set([...this.#roles])

    if (this.#subgroups.size > 0) {
      this.#subgroups.forEach(subgroup => {
        roles = new Set([...roles, ...IAM.getGroup(subgroup).permissions])
      })
    }

    return roles
  }

  /**
   * @property {object}
   * Contains the group data. This can be used to save the group configuration
   * or for reporting purposes.
   *
   * ```
   * {
   *   "name": "string",
   *   "memberOf": ["groupNameA", "groupNameB"],
   *   "members": ["User Name A", 'User Name B'],
   *   "roles": ["Role Name A", "Role Name B"]
   * }
   * ```
   */
  get data () {
    return {
      name: this.#name,
      memberOf: Array.from(this.#memberOf).map(group => IAM.getGroup(group).name),
      members: Array.from(this.#members).map(user => user.name),
      roles: Array.from(this.#roles).map(oid => IAM.getRole(oid).name)
    }
  }

  /**
   * Add one or more roles to the group. Each argument
   * can be the name of a role, the ID of a role, or the
   * IAM.Role object.
   * @chainable
   * @return {IAM.Group}
   */
  assign () {
    Array.from(arguments).forEach(role => {
      if (IAM.roleExists(role)) {
        this.#roles.add(IAM.getRole(role).OID)
      } else {
        throw new Error(`"${role}" is not a recognized role.`)
      }
    })

    return this
  }

  // alias
  addRole () {
    console.log('IAM.Group.addRole() is deprecated. Use IAM.Group.assign() instead.')
    return this.assign(...arguments)
  }

  /**
   * Remove one or more roles from the group.
   * Each argument can be the name of a role, a role ID,
   * or the IAM.Role object.
   * @chainable
   * @return {IAM.Group}
   */
  revoke () {
    Array.from(arguments).forEach(role => this.#roles.delete(IAM.getRole(role).OID))

    return this
  }

  removeRole () {
    console.log('IAM.Group.removeRole() is deprecated. Use IAM.Group.revoke() instead.')
    return this.revoke(...arguments)
  }

  /**
   * Remove all roles from the group.
   * @chainable
   * @return {IAM.Group}
   */
  clearRoles () {
    this.#roles = new Set()

    return this
  }

  /**
   * Add a member to the group. All arguments should be
   * IAM.User, IAM.Group, or the name of a group.
   * @chainable
   * @return {IAM.Group}
   */
  addMember () {
    Array.from(arguments).forEach(member => {
      if (member instanceof IAM.User) {
        this.#members.add(member)
        member.addMembership(this.#oid)
      } else if (member instanceof Group) {
        member.addParentGroup(this)
      } else if (typeof member === 'string') {
        IAM.getGroup(member).addParentGroup(this)
      } else {
        throw new Error(`Could not add a non-user/group member (${member}) to ${this.name}`)
      }
    })

    return this
  }

  /**
   * Remove a member from the group. All arguments should be
   * IAM.User, IAM.Group, or the name of a group.
   * @chainable
   * @return {IAM.Group}
   */
  removeMember () {
    Array.from(arguments).forEach(member => {
      if (member instanceof IAM.User) {
        this.#members.delete(member.OID)
        member.removeMembership(this.#oid)
      } else if (member instanceof Group) {
        member.removeParentGroup(this)
      } else if (typeof member === 'string') {
        IAM.getGroup(member).removeParentGroup(this)
      }
    })

    return this
  }

  /**
   * Remove all members from the group (leaves it empty).
   * @chainable
   * @return {IAM.Group}
   */
  clearMembers () {
    this.#members.forEach(user => user.removeMembership(this.#oid))
    this.#members = new Set()

    this.#subgroups.forEach(group => this.removeMember(group))
    return this
  }

  /**
   * Trace the lineage of a right/permission, back to the source.
   * This is useful for answering questions like "what group
   * granted or denied a particular permission?"
   * @param  {string} resource
   * Resource name.
   * @param  {string} right
   * Permission/right.
   * @return {IAM.Lineage}
   */
  trace (resource, right) {
    let data = new Lineage(...arguments)

    // Identify non-nested roles
    for (let role of Array.from(this.#roles).map(role => IAM.getRole(role))) {
      let permissions = role.rights.get(resource)

      if (permissions) {
        for (let permission of permissions) {
          if (permission.is(right)) {
            if (permission.forced) {
              data.allow(true)
              data.role = role
              data.stack = [this, role, permission]
              return data
            } else if (permission.deined) {
              data.role = role
              data.deny()
              data.stack = [this, role, permission]
            } else if (permission.is(right) && !data.hasOwnProperty('role')) {
              data.role = role
              data.allow()
              data.stack = [this, role, permission]
            }
          }
        }
      }
    }

    for (let group of this.#subgroups) {
      let lineage = IAM.getGroup(group).trace(...arguments)

      if (lineage !== null && (!data.hasOwnProperty('role') || lineage.forced || !data.allowed)) {
        data.stack = [...[this], ...lineage.stack]//, ...data.stack]
        data.role = lineage.role
        data.group = this

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

    return data
  }
}
