import Entity from './Entity.js'
import { getTrumpingPermission, throwError } from './utilities.js'
import Permission from './Permission.js'

export default class Profile extends Entity {
  #permissions = new Map
  #roles = []
  #weights

  constructor ({ type, domain, parent, name, description, permissions = {}, roles = [], ttl, weights, internalEvents = [] }) {
    super({ type, domain, parent, name, description, ttl, internalEvents })

    this.#roles = roles
    this.#weights = weights
    
    for (const [resource, spec] of Object.entries(permissions)) {
      [...(Array.isArray(spec) ? spec : [spec])].forEach(spec => this.setPermission(resource, spec))
    }
  }

  get data () {
    return {
      ...super.data,
      ...this.#getAllPermissions(true)
    }
  }

  get permissions () {
    return this.#getAllPermissions()
  }

  get weights () {
    return this.#weights
  }

  getPermissions (resource, right) {
    const permissions = this.#permissions.get(resource)
    
    return permissions
      ? right
        ? [...(permissions.get(right) ?? [])]
        : [...permissions.values()].flat()
      : []
  }

  hasPermission(resource, right) {
    return getTrumpingPermission(
      ...this.getPermissions(resource, right),
      ...this.#roles.flatMap(role => this.domain.getRole(role)?.getPermissions(resource, right) ?? [])
    )?.allows ?? false
  }

  setPermission (resource, spec) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('set', spec, resource)

    const rights = this.#permissions.get(resource) ?? new Map
    rights.size === 0 && this.#permissions.set(resource, rights)

    return this.#setPermission(resource, spec, rights)
  }

  #getAllPermissions (asText = false) {
    return Object.fromEntries([...this.#permissions.entries()].map(([resource, rights]) => {
      return [resource, [...rights.values()].reduce((result, permissions) => {
        asText
          ? permissions.forEach(permission => result.push(permission.toString()))
          : result.push(...permissions)

        return result
      }, [])]
    }))
  }

  #setPermission(resource, spec, rights) {
    const permission = new Permission({
      domain: this.domain,
      parent: this,
      resource,
      spec
    }), { right } = permission
    
    rights.set(right, (rights.get(right) ?? new Set()).add(permission))
    return permission
  }

  #throwMissingResourceError (action, spec, resource) {
    return throwError(this.domain, `Cannot ${action} Right "${spec}" on unknown Resource "${resource}".`)
  }

  #throwUnsetRightError (right, resource, message) {
    return throwError(this.domain, `Cannot unset Right "${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; ${message}`)
  }
}