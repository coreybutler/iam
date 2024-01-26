import Entity from '../src/Entity.js'
import PermissionManager from './PermissionManager.js'
import { getTrumpingPermission, throwError } from '../src/utilities.js'

export default class PermissionManagingEntity extends Entity {
  #permissions
  #roles = []

  constructor ({ type, domain, parent, name, description, permissions = {}, roles = [], ttl, weights, internalEvents = [] }) {
    super({ type, domain, parent, name, description, ttl, internalEvents })
    // this.#permissions = new PermissionManager({ domain, parent: this, permissions, weights })

    for (const role of roles) {
      this.#roles.push(role)
    }
  }

  get data () {
    return {
      ...super.data
    }
  }

  // get permissions () {
  //   return this.#permissions.data
  // }

  // assignRole (role) {
  //   console.log('ASSIGN ROLE', role)
  // }

  // unassignRole (role) {
  //   console.log('REVOKE ROLE', role)
  // }

  // hasRole (role) {
  //   return this.#roles.includes(role)
  // }

  // // destroy () {
  // //   return this.parent.remove(this.name)
  // // }

  // // getPermission (resource, right) {
  // //   if (!right) return this.domain.logError(`${this.type} getPermission method requires two arguments; a Resource string and a Right string. Example: getPermission('My Resource', 'deny:view')`)
  // //   return right ? getTrumpingPermission(...this.#permissions.get(resource, right)) : null
  // // }

  // getPermissions (resource, right) {
  //   return 

  //   // return right
  //   //   ? this.#permissions.get(...arguments)
  //   //   : Object.values(this.#permissions.get(resource)).reduce((result, permissions) => {
  //   //     result.push(...permissions)
  //   //     return result
  //   //   }, [])
  // }

  // hasAllPermissions (resource) {
  //   console.log(this.domain.getResource(resource)?.rights.map(({ name }) => this.hasPermission(resource, name)));
  //   // return this.domain.getResource(resource)?.rights.every(right => this.hasPermission(resource, right))
  //     // ?? throwError(this.domain, `Cannot check permissions on unknown Resource "${resource}"`)
  // }

  // hasAnyPermission (resource) {
  //   return this.#permissions.hasAny(resource)
  // }

  // hasEachPermission (resource, ...rights) {
  //   return this.#permissions.hasEach(...arguments)
  // }
  
  // hasPermission (resource, right) {
  //   return getTrumpingPermission(
  //     getTrumpingPermission(...this.getPermissions(...arguments)),

  //     getTrumpingPermission(...this.#roles.reduce((permissions, role) => {
  //       role = this.domain.getRole(role)
  //       permissions.push(...role.getPermissions(resource, right))
  //       return permissions
  //     }, []))
  //   )?.allows ?? false
  // }

  // hasSomePermission (resource, ...rights) {
  //   return this.#permissions.hasSome(...arguments)
  // }

  // setPermission (resource, spec) {
  //   return this.#permissions.set(resource, spec)
  // }

  // unsetPermission (resource, name) {
  //   return this.#permissions.unset(resource, name)
  // }
}