import { getTrumpingPermission, throwError } from './utilities.js'

export default class ACL {
  #permissions
  #resource

  constructor (solver, resource) {
    this.#permissions = solver.getPermissions(resource)
    this.#resource = solver.domain.getResource(resource)

    solver.on('permission.set', () => {
      this.#permissions = solver.getPermissions(resource)
    })
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

  allowsEach (...rights) {
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