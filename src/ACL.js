import { getTrumpingPermission, throwError } from './utilities.js'

export default class ACL {
  #permissions
  #resource

  constructor (resource, permissions) {
    this.#permissions = permissions
    this.#resource = resource
  }

  get allowsAll () {
    return this.#resource.rights.every(({ name }) => this.#trumpingPermissionAllows(name))
  }

  get allowsAny () {
    return this.#resource.rights.some(({ name }) => this.#trumpingPermissionAllows(name))
  }

  get permissions () {
    return [...new Set([...this.#permissions.map(permission => permission.toString())])]
  }

  allows (right) {
    return this.#trumpingPermissionAllows(right)
  }

  allowsEvery (...rights) {
    return rights.every(right => this.#trumpingPermissionAllows(right))
  }

  allowsSome (...rights) {
    return rights.some(right => this.#trumpingPermissionAllows(right))
  }

  #trumpingPermissionAllows (name) {
    return this.#resource.hasRight(name)
      ? getTrumpingPermission(...this.#permissions.filter(({ right }) => right === name))?.allows ?? false
      : throwError(this.#resource.domain, `Resource "${this.#resource.name}" does not include Right "${name}"`)
  }
}