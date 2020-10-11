import Base from '../base.js'
import Right from './right.js'
import { getResource, REGISTRY_ID } from '../utilities.js'

const INTERNAL_ROLES = new Set()

/**
 * Represents a role within the system. This
 * is a collection of permissions for
 * _system features_, typically based on how the
 * features are used together.
 */
export default class Role extends Base {
  #permissions = new Map()

  constructor () {
    if (INTERNAL_ROLES.has(arguments[0]) || (typeof arguments[0] === 'string' && INTERNAL_ROLES.has(Symbol.for(arguments[0])))) {
      throw new Error('Cannot redefine an internal role: ' + arguments[0].toString())
    }

    super({
      name: arguments[0] || 'placeholder',
      type: 'role'
    })

    for (const permission of Array.from(arguments).slice(1)) {
      if (typeof permission !== 'object') {
        throw new Error('Invalid argument. Must provide a key/value object.')
      }

      for (const [resource, rights] of Object.entries(permission)) {
        this.assignRights(resource, ...(Array.isArray(rights) ? rights : [rights]).map(r => r instanceof Right ? r : new Right(r)))
      }
    }

    this.register()

    if (typeof arguments[0] === 'symbol') {
      INTERNAL_ROLES.add(this.OID)
    }
  }

  get data () {
    const { rights } = this

    for (const [right, perms] of Object.entries(rights)) {
      rights[right] = perms.map(p => p.data)
    }

    return Object.assign({}, super.data, { rights })
  }

  /**
   * @property {String[]} resourceList
   * A representation of the resource names associated to the role.
   */
  get resourceList () {
    return Array.from(this.#permissions.keys())
  }

  /**
   * @property {Resource[]} resources
   * A representation of the resources associated to the role.
   */
  get resources () {
    return this.resourceList.map(r => getResource(r))
  }

  /**
   * @property {Object} rights
   * A representation of the rights by resource.
   */
  get rights () {
    return Object.fromEntries(this.#permissions)
  }

  /**
   * Determines whether the role is applied to a particular resource
   * @param {string} resource
   * The name of the resource.
   * @return {boolean}
   */
  appliesToResource (resource) {
    resource = getResource(resource, true)
    return this.#permissions.has(resource.name)
  }

  /**
   * Assign rights to the role.
   * This accepts any number of arguments, which can be a
   * string representation of a right or an instance of `Right`.
   */
  assignRights () {
    const rights = Array.from(arguments)
    const resource = getResource(rights.shift(), true)

    this.#permissions.set(resource.name, rights.map(r => r instanceof Right ? r : new Right(r)))
    resource.associate(this)
  }

  /**
   * Revoke rights from the role.
   * This accepts any number of arguments, which can be a
   * string representation of a right or an instance of `Right`.
   */
  revokeRights () {
    if (arguments.length === 0) {
      for (const resource of globalThis[REGISTRY_ID].resources) {
        if (this.#permissions.has(resource.name)) {
          resource.unassociate(this)
        }
      }

      this.#permissions = new Map()
      return
    }

    const rights = Array.from(arguments)
    const resource = getResource(rights.shift())

    if (resource) {
      if (rights.length === resource.rights.length || rights.length === 0) {
        this.#permissions.delete(resource.name)
        resource.unassociate(this)
      } else {
        this.#permissions.set(resource.name, rights.map(r => r instanceof Right ? r : new Right(r)))
      }
    }
  }

  /**
   * Determines whether the resource with the specified
   * right is authorized by the role.
   * @param {string} resource
   * The name of the resource.
   * @param {string|Right} right
   * The right/permission to authorize.
   * @return {boolean}
   */
  authorized (resource, right) {
    const rights = this.#permissions.get(resource)

    if (!rights) {
      return false
    }

    for (const permission of rights) {
      if (permission.is(right)) {
        return permission.granted
      }
    }

    return false
  }

  reset () {
    this.#permissions = new Map()
    super.reset()
  }
}
