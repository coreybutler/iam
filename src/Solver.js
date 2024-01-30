import Entity from './Entity.js'
import { getTrumpingPermission, throwError } from './utilities.js'
import Permission from './Permission.js'
import ACL from './ACL.js'

export default class Solver extends Entity {
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
      permissions: this.permissions
    }
  }

  get permissions () {
    const resources = this.domain.resources

    return Object.fromEntries(resources.reduce((result, { name, rights }) => {
      const permissions = this.#getPermissions({ resource: name })

      permissions.length > 0 && result.push([name, rights.reduce((result, { name }) => {
        const trump = getTrumpingPermission(...permissions.filter(({ right }) => right === name))
        trump && result.push(trump.toString())
        return result
      }, [])])

      return result
    }, []))
  }

  get weights () {
    return this.#weights
  }

  getACL (resource) {
    return new ACL(this.domain.getResource(resource), this.#getPermissions({ resource }))
  }

  setPermission (resource, spec) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('set', spec, resource)

    const rights = this.#permissions.get(resource) ?? new Map
    rights.size === 0 && this.#permissions.set(resource, rights)

    return this.#setPermission(resource, spec, rights)
  }

  #getPermissions ({ resource, right, asString = false }) {
    const local = this.#permissions.get(resource),
          permissions = [
            ...(right
              ? (local?.get(right) ?? [])
              : ([...local?.values() ?? []].flatMap(permissions => [...permissions]) ?? [])
            ),
      
            ...this.#roles.flatMap(role => this.domain.getRole(role)?.#getPermissions({ resource, right }) ?? [])
          ]

    return asString ? permissions.map(permission => permission.toString()) : permissions
  }

  #setPermission (resource, spec, rights) {
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

// ##getPermissions (asText = false) {
  //   return Object.fromEntries([...this.#permissions.entries()].map(([resource, rights]) => {
  //     return [resource, [...rights.values()].reduce((result, permissions) => {
  //       asText
  //         ? permissions.forEach(permission => result.push(permission.toString()))
  //         : result.push(...permissions)

  //       return result
  //     }, [])]
  //   }))
  // }

  // isAllowedAll (resource) {
  //   const permissions = this.#getPermissions(resource)

  //   return this.domain.getResource(resource)?.rights.every(({ name }) => {
  //     return getTrumpingPermission(...permissions.filter(({ right }) => right === name))?.allows ?? false
  //   }) ?? false
  // }

  // isAllowed (resource, right) {
  //   return getTrumpingPermission(...this.#getPermissions(...arguments))?.allows ?? false
  // }