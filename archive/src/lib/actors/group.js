import Trace from '../trace.js'
import Manager from '../manager.js'
import Role from './role.js'
import User from './user.js'
import { REGISTRY_ID, hiddenconstant, getRole, getGroup } from '../utilities.js'

/**
 * Represents a group of users and groups (groups can be nested).
 */
export default class Group extends Trace {
  #members = new Set()
  #memberGroups = new Set()
  #memberOf = new Set()
  #roles = new Manager(Role)

  constructor (name) {
    if (getGroup(name)) {
      throw new Error(`Cannot create ${name} group (already exists).`)
    }

    super({ name, type: 'group' })

    Object.defineProperties(this, {
      childOf: hiddenconstant(parent => {
        if (this.#memberGroups.has(parent)) {
          throw new Error(`Cannot make ${parent.name} a child of ${this.name} because ${parent.name} is a member of ${this.name} (circular grouping).`)
        }

        this.#memberOf.add(parent)
      }),
      removeChildOf: hiddenconstant(parent => this.#memberOf.delete(parent)),
      isChildOf: hiddenconstant(group => {
        if (this.parentGroups.has(group)) {
          return true
        }

        for (const pg of this.parentGroups) {
          if (group.isChildOf(pg)) {
            return true
          }
        }

        return false
      }),
      parentGroups: {
        get () {
          return this.#memberOf
        }
      },
      /**
       * @property {Set} permissions
       * A set of `Role` objects representing all roles
       * belonging to the group or any subgroup.
       * @private
       */
      permissions: {
        get () {
          const roles = new Set(this.roles)

          for (const group of this.subgroups) {
            for (const role of group.roles) {
              roles.add(role)
            }
          }

          return roles
        }
      },
      /**
       * Determines whether a role is assigned in the group
       * or any member group (subgroup).
       * @param {String|Role} role
       * The name or instance of `Role` to detect.
       * @return {boolean}
       * @private
       */
      permitted: hiddenconstant(role => {
        role = getRole(role)

        if (!role) {
          return false
        }

        if (this.#roles.has(role)) {
          return true
        }

        for (const group of this.subgroups) {
          for (const subrole of group.roles) {
            if (role === subrole) {
              return true
            }
          }
        }

        return false
      })
    })

    this.register()
  }

  get data () {
    return Object.assign({}, super.data, {
      roles: this.roles.map(r => r.data),
      members: this.members.map(u => u.type === 'user' ? u.data : { type: u.type, name: u.name }),
      memberOf: Array.from(this.#memberOf).map(m => m.data)
    })
  }

  /**
   * @property {Role[]} roles
   * The roles assigned to the group.
   */
  get roles () {
    return this.#roles.items
  }

  /**
   * @property {String[]} roleList
   * The role names assigned to the group.
   */
  get roleList () {
    return this.#roles.list
  }

  /**
   * @property {number} memberCount
   * The number of members contained in the group.
   */
  get memberCount () {
    return this.#members.size + this.#memberGroups.size
  }

  /**
   * @property {number} userCount
   * The number of users contained in the group.
   */
  get userCount () {
    return this.#members.size
  }

  /**
   * @property {number} groupCount
   * The number of groups contained in the group.
   */
  get groupCount () {
    return this.#memberGroups.size
  }

  /**
   * @property {number} parentCount
   * The number of parents contained in the group.
   */
  get parentCount () {
    return this.#memberOf.size
  }

  /**
   * @property {Group[]} subgroups
   * The groups (children) in the group.
   */
  get subgroups () {
    return Array.from(this.#memberGroups.values())
  }

  /**
   * @property {Group[]} subgroupList
   * The group names (children) in the group.
   */
  get subgroupList () {
    return this.subgroups.map(g => g.name)
  }

  /**
   * @property {User[]} users
   * The users (children) in the group.
   */
  get users () {
    return Array.from(this.#members.values())
  }

  /**
   * @property {String[]} userList
   * The user names (children) in the group.
   */
  get userList () {
    return this.users.map(u => u.name)
  }

  /**
   * @property {Array} members
   * Contains users and groups belonging to the group.
   */
  get members () {
    return this.subgroups.concat(this.users)
  }

  /**
   * @property {String[]} memberList
   * Contains the name of each member (user or group)
   */
  get memberList () {
    return this.members.map(m => m.name)
  }

  /**
   * Add one or more roles to the group. Each argument
   * can be the name of a role, the ID of a role, or the
   * IAM.Role object.
   * @chainable
   * @return {Group}
   */
  assign () {
    for (const role of arguments) {
      const assignedRole = getRole(role, true)

      if (!this.#roles.has(assignedRole)) {
        this.#roles.add(assignedRole)
        this.emit('role.assign', assignedRole)
      }
    }

    return this
  }

  /**
   * Remove one or more roles from the group.
   * Each argument can be the name of a role, a role ID,
   * or the IAM.Role object.
   * @chainable
   * @return {Group}
   */
  revoke () {
    for (const role of arguments) {
      const assignedRole = globalThis[REGISTRY_ID].role(role)

      if (assignedRole && !this.#roles.has(assignedRole)) {
        this.#roles.delete(assignedRole)
        this.emit('role.revoke', assignedRole)
      }
    }

    return this
  }

  /**
   * Add a member or child group to the group. All arguments should be
   * `User`, `Group`, or the name of a group.
   * @chainable
   * @return {Group}
   */
  add () {
    for (const arg of arguments) {
      let group = arg

      if (typeof arg === 'string') {
        group = globalThis[REGISTRY_ID].group(arg)
      }

      if (group && group.type) {
        switch (group.type) {
          case 'group':
            if (this.isChildOf(group)) {
              throw new Error(`Cannot add "${group.name}" to ${this.name} group. (${this.name} is a subgroup of ${group.name} - circular dependency)`)
            }

            if (!this.#memberGroups.has(group)) {
              this.#memberGroups.add(group)
              group.childOf(this)
              this.emit('member.add', { member: group, type: group.type })
            }

            break

          case 'user':
            if (!this.#members.has(group)) {
              this.#members.add(group)
              group.join(this)
              this.emit('member.add', { member: group, type: group.type })
            }
            break

          default:
            throw new Error(`Cannot group.add() to assign the ${group.name} role to the ${this.name} group. Use group.assign() instead.`)
        }
      } else {
        throw new Error(`Cannot add "${group}" to ${this.name} ${this.type} (Invalid type).`)
      }
    }

    return this
  }

  /**
   * Remove a member or child group to the group. All arguments should be
   * `User`, `Group`, or the name of a group.
   * @chainable
   * @return {IAM.Group}
   */
  remove () {
    for (const arg of arguments) {
      let group = arg

      if (typeof arg === 'string') {
        group = globalThis[REGISTRY_ID].group(arg)
      }

      if (group instanceof Group) {
        if (this.#memberGroups.has(group)) {
          this.#memberGroups.delete(group)
          group.removeChildOf(this)
          this.emit('member.remove', { member: group, type: group.type })
        }
      } else if (group instanceof User) {
        if (this.#members.has(group)) {
          this.#members.delete(group)
          this.emit('member.remove', { member: group, type: group.type })
        }
      } else if (group instanceof Role) {
        throw new Error(`Cannot group.remove() to revoke the ${group.name} role from the ${this.name} group. Use group.revoke() instead.`)
      } else {
        throw new Error(`Cannot remove "${group}" from ${this.name} ${this.type} (Invalid type).`)
      }
    }

    return this
  }

  clearRoles () {
    if (this.#roles.size > 0) {
      for (let role of this.#roles.items) {
        role = globalThis[REGISTRY_ID].role(typeof role === 'string' ? role : role.name)

        if (this.#roles.has(role)) {
          this.#roles.delete(role)
        }
      }

      this.emit('clear.roles')
    }

    return this
  }

  clearSubgroups () {
    if (this.#memberGroups.size > 0) {
      this.remove(...this.subgroups)
      this.emit('clear.subgroups')
    }

    return this
  }

  clearUsers () {
    if (this.#members.size > 0) {
      this.remove(...this.users)
      this.emit('clear.users')
    }

    return this
  }

  has (element) {
    return this.#members.has(element) || this.#memberGroups.has(element)
  }

  destroy () {
    for (const group of this.#memberOf.entries()) {
      group.remove(this)
    }

    for (const user of this.#members.entries()) {
      user.leave(this)
    }

    super.destroy()

    return this
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
    return super.trace(resource, right, this.#roles, this.#memberGroups)
  }
}
