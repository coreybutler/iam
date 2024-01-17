import { hiddenconstant } from '../utilities.js'
import Base from '../base.js'
import Right from './right.js'

/**
 * Represents a system resource, component, or
 * element of the system. Resources have rights (permissions),
 * which are used to authorize users/groups by role.
 */
export default class Resource extends Base {
  #rights = new Set()
  #roles = new Set()

  constructor () {
    super({
      name: arguments[0] || 'placeholder',
      type: 'resource'
    })

    for (const permission of Array.from(arguments).slice(1)) {
      this.#rights.add(new Right(permission))
    }

    Object.defineProperties(this, {
      associate: hiddenconstant(role => {
        this.#roles.add(role)
        this.emit('role.associate', role)
      }),
      unassociate: hiddenconstant(role => {
        this.#roles.delete(role)
        this.emit('role.unassociate', role)
      })
    })

    this.register()
  }

  /**
   * @property {Right[]} rights
   * A representation of the rights associated with the resource.
   */
  get rights () {
    return Array.from(this.#rights)
  }

  get data () {
    return Object.assign({}, super.data, {
      rights: Array.from(this.#rights).map(r => r.data)
    })
  }

  /**
   * Indicates the resource has the named right.
   * @param {string} right
   * @return {boolean}
   */
  has (right) {
    const name = right.split(':').pop()

    if (name === '*' || name === 'all') {
      return true
    }

    for (const perm of this.#rights) {
      if (perm.name === name) {
        return true
      }
    }

    return false
  }

  destroy () {
    for (const role of this.#roles) {
      role.revokeRights(this)
    }

    this.#roles = new Set()
  }
}
