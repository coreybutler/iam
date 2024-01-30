import { getTrumpingPermission } from './utilities.js'

export default class ACL {
  #permissions
  #resource

  constructor (resource, permissions) {
    this.#permissions = permissions
    this.#resource = resource
  }

  get allowsAll () {
    return this.#resource.rights.every(({ name }) => {
      return getTrumpingPermission(...this.#getPermissionsByRight(name))?.allows ?? false
    }) ?? false  
  }

  get permissions () {
    return this.#permissions.map(permission => permission.toString())
  }

  allows (right) {
    return getTrumpingPermission(...this.#getPermissionsByRight(right))?.allows ?? false
  }

  allowsAny () {

  }

  allowsEvery () {

  }

  allowsSome () {

  }

  #getPermissionsByRight (name) {
    return this.#permissions.filter(({ right }) => right === name)
  }
}