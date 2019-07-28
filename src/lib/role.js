import IAM from '../main.js'
import Right from './right.js'

export default class Role {
  #oid = null
  #name = 'Untitled Role'
  #permissions = new Map()

  #forceArray = function () {
    if (arguments.length > 1) {
      return Array.from(arguments)
    }

    if (!Array.isArray(arguments[0])) {
      return [arguments[0]]
    }

    return arguments[0]
  }

  constructor (name, rights = null) {
    this.#name = name
    this.#oid = Symbol(`${name} role`)
    IAM.registerRole(this)
  }

  get name () {
    return this.#name
  }

  get OID () {
    return this.#oid
  }

  get resources () {
    return this.#permissions
  }

  get resourceNames () {
    return Array.from(this.#permissions.keys())
  }

  get data () {
    let data = {}

    this.#permissions.forEach((rights, resource) => {
      return data[resource] = Array.from(rights).map(right => right.data)
    })

    return data
  }

  get rights () {
    return this.#permissions
  }

  appliesToResource (resource) {
    return this.#permissions.has(resource)
  }

  assignRights (resource, rights = new Set()) {
    rights = rights instanceof Symbol ? rights : new Set([...this.#forceArray(rights)])
    rights = new Set([...Array.from(rights).map(right => right instanceof Right ? right : new Right(right))])
    this.#permissions.set(resource, rights)
  }

  authorized (resource, right) {
    let rights = this.#permissions.get(resource)

    if (!rights) {
      return false
    }

    for (let permission of rights) {
      if (permission.is(right)) {
        return permission.allowed
      }
    }

    return false
  }

  clear () {
    this.#permissions = new Map()
  }

  // TODO: Add resource pointers
  // TODO: Add member mappings/pointers
}
