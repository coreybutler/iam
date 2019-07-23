import User from './group.js'
import IAM from '../main.js'

export default class Group {
  #oid = null
  #name = null
  #members = new Set()
  #memberOf = new Set()
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
        }
      },
      removeParentGroup: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: group => {
          this.#memberOf.remove(group)
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

    if (this.#memberOf.size > 0) {
      
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
}
