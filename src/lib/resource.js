import IAM from '../main.js'
import Right from './right.js'

/**
 * @class IAM.Resource
 * Represents a system resource, component, or
 * element of the system. Resources have rights (permissions),
 * which are used to authorize users/groups by role.
 */
export default class Resource {
  #oid = Symbol('resource')
  #name = null
  #rights = new Map()
  #description = null

  constructor () {
    this.#name = arguments[0]
    this.#oid = Symbol(`${this.#name} resource`)

    Array.from(arguments).forEach((permission, i) => {
      if (i > 0) {
        let right = new Right(permission)

        this.#rights.set(right.name, right)
      }
    })
  }

  /**
   * @property {Symbol} OID
   * The object ID of the resource.
   */
  get OID () {
    return this.#oid
  }

  /**
   * @property {string} name
   * Name of the resource.
   */
  get name () {
    return this.#name
  }

  /**
   * @property {string} [description]
   * A description od the resource. This is used primarily
   * for reporting purposes.
   */
  get description () {
    return this.#description || `${this.#name} resource.`
  }

  set description (value) {
    if (this.#description !== value) {
      this.#description = value.trim()
    }
  }

  /**
   * @property {Map} rights
   * A representation of the rights associated with the resource.
   */
  get rights () {
    return this.#rights
  }

  get data () {
    return {
      name: this.#name,
      description: this.description,
      rights: Array.from(this.#rights.keys())
    }
  }
}
