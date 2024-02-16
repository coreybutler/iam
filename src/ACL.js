import EventEmitter from './EventEmitter.js'
import Lineage from './Lineage.js'
import { throwError } from './utilities.js'

export default class ACL extends EventEmitter {
  #resource
  #solver

  constructor (solver, resource) {
    super()
    this.#resource = solver.domain.getResource(resource)
    this.#solver = solver
  }

  get allowsAll () {
    return this.#resource.rights.every(({ name }) => this.#trumpingPermissionAllows(name))
  }

  get allowsAny () {
    return this.#resource.rights.some(({ name }) => this.#trumpingPermissionAllows(name))
  }

  get permissions () {
    return [...new Set([...this.#solver.getPermissions(this.#resource.name).map(perm => perm.toString())])]
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

  getLineage (right) {
    const permission = this.#solver.getPermission(this.#resource.name, right)

    return permission
      ? Object.freeze(new Lineage(this.#solver, permission))
      : null
  }

  #trumpingPermissionAllows (right) {
    return this.#resource.hasRight(right)
      ? this.#solver.getPermission(this.#resource.name, right)?.allows ?? false
      : throwError(this.#resource.domain, `Resource "${this.#resource.name}" does not include Right "${right}"`)
  }
}