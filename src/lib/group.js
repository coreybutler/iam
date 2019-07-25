import User from './group.js'
import IAM from '../main.js'

export default class Group {
  #oid = null
  #name = null
  #members = new Set()
  #memberOf = new Set()
  #subgroups = new Set()
  #roles = new Set()

  constructor (name = 'Unknown Group') {
    this.#name = name
    this.#oid = Symbol(this.#name)

    IAM.registerGroup(this)

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
      }
    })
  }

  get OID () {
    return this.#oid
  }

  get name () {
    return this.#name
  }

  get roles () {
    let roles = new Set([...this.#roles])

    if (this.#subgroups.size > 0) {
      this.#subgroups.forEach(subgroup => {
        roles = new Set([...roles, ...IAM.getGroup(subgroup).roles])
      })
    }

    return Array.from(roles)
  }

  addRole () {
    Array.from(arguments).forEach(role => {
      if (IAM.roleExists(role)) {
        this.#roles.add(role)
      } else {
        throw new Error(`"${role}" is not a recognized role.`)
      }
    })

    return this
  }

  removeRole () {
    Array.from(arguments).forEach(role => this.#roles.delete(role))

    return this
  }

  clearRoles () {
    this.#roles = new Set()

    return this
  }

  /**
   * Add a member to the group. All arguments should be
   * IAM.User, IAM.Group, or the name of a group.
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
   */
  removeMember () {
    Array.from(arguments).forEach(member => {
      if (member instanceof IAM.User) {
        this.#members.delete(member.OID)
        user.removeMembership(this.#oid)
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
   */
  clearMembers () {
    this.#members = new Set()
    this.#members.forEach(user => user.removeMembership(this.#oid))
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
   * @return {Object}
   *
   */
  trace (resource, right) {
    let data = {
      type: 'group',
      group: this.#name,
      resource,
      right,
      allowed: false,
      lineage: null
    }

    // Identify non-nested roles
    for (let role of this.#roles) {
      let rights = IAM.getRoleRights(role)

      if (rights[resource]) {
        for (let perm of rights[resource]) {
          let permission = (new RegExp(`((allow|deny)\\:)?(${right}|\\*)`, 'i')).exec(perm)

          if (permission !== null) {
            if (permission[2] === 'allow') {
              return Object.assign(data, {
                role,
                allowed: true,
                lineage: `${this.#name} (group) --> ${role} (role) --> ${right} (permission)`
              })
            } else if (permission[2] === 'deny') {
              data = Object.assign(data, {

              })
            } else if (permission[3] === right && !data.hasOwnProperty('role')) {
              data = Object.assign(data, {
                role,
                allowed: true,
                lineage: `${this.#name} (group) --> ${role} (role) --> ${right} (permission)`
              })
            }
          }
        }
      }
    }

    console.log(this.#subgroups, this.#name)

    return data.lineage !== null ? data : null
  }
}
