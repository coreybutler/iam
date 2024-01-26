import Permission from './Permission.js'
import Component from './Component.js'
import { getTrumpingPermission, throwError } from './utilities.js'

export default class PermissionManager extends Component {
  #weights
  #resources = new Map

  constructor ({ domain, parent, permissions, weights }) {
    super({
      type: 'Permission Manager',
      domain,
      parent
    })

    this.#weights = weights

    for (const [resource, spec] of Object.entries(permissions)) {
      [...(Array.isArray(spec) ? spec : [spec])].forEach(spec => this.set(resource, spec))
    }
  }

  get data () {
    return Object.fromEntries([...this.#resources.entries()].map(([resource, rights]) => {
      return [resource, [...rights.entries()].reduce((result, [right, permissions]) => {
        permissions.forEach(({ type }) => result.push(`${type}:${right}`))
        return result
      }, [])]
    }))
  }

  get weights () {
    return this.#weights
  }

  get (resource, right) {
    const permissions = this.#resources.get(resource)

    

    // return permissions
    //   ? right
    //     ? [...(permissions.get(right) ?? []), ...(permissions.get('*') ?? [])]
    //     : Object.fromEntries([...permissions.entries()].map(([right, permissions]) => {
    //       return [right, [...permissions]]
    //     }))
    //   : []
  }

  has (resource, right) {
    return this.#hasPermission(this.get(resource), right)
    
    // return rights
    //   ? right
    //     ? this.#hasPermission(rights, right)
    //     : [...Object.values(rights)].some(permissions => permissions.some(permissionAllows))
    //   : false
  }

  hasAll (resource) {
    const permissions = this.get(resource)
    return this.domain.getResource(resource)?.rights.every(({ name }) => this.#hasPermission(permissions, name))
  }

  hasAny (resource) {
    const permissions = this.get(resource)
    return this.domain.getResource(resource)?.rights.some(({ name }) => this.#hasPermission(permissions, name))
  }

  hasEach (resource, ...rights) {
    const permissions = this.get(resource)
    return rights.every(right => this.#hasPermission(permissions, right))
    // return Object.keys(permissions ?? {}).every(right => rights.includes(right) && this.#hasPermission(permissions, right))
  }

  hasSome (resource, ...rights) {
    const permissions = this.get(resource)
    return rights.some(right => this.#hasPermission(permissions, right))
    // return Object.keys(permissions ?? {}).some(right => rights.includes(right) && this.#hasPermission(permissions, right))
  }

  set (resource, spec) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('set', spec, resource)

    let rights = this.#resources.get(resource)

    if (!rights) {
      rights = new Map
      this.#resources.set(resource, rights)
    }

    return this.#setPermission(...arguments, rights)
  }

  unset (resource, spec) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('unset', spec, resource)
    
    const rights = this.#resources.get(resource),
          [permission, right] = spec.includes(':') ? spec.split(':') : ['allow', spec]

    if (!rights) return this.domain.logError(
      `Cannot unset Right "${permission}:${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; Resource "${resource}" is not associated with ${this.parent.type} "${this.parent.name}".`
    )

    const permissions = rights.get(right)

    if (!permissions) return this.#throwUnsetRightError(spec, resource, `Right "${right}" is not associated with ${this.parent.type} "${this.parent.name}"`)
    if (!permissions.has(permission)) return this.#throwUnsetRightError(spec, resource, `Relationship "${permission}" has not been associated with Right "${right}" on this ${this.parent.type}.`)

    permissions.delete(permission)
  }

  #hasPermission (permissions, right) {
    permissions = [...(permissions[right] ?? []), ...(permissions['*'] ?? [])]

    return permissions.length > 0
      ? getTrumpingPermission(...permissions).allows
      : false
  }

  #throwMissingResourceError (action, spec, resource) {
    return throwError(this.domain, `Cannot ${action} Right "${spec}" on unknown Resource "${resource}".`)
  }

  #throwUnsetRightError (right, resource, message) {
    return throwError(this.domain, `Cannot unset Right "${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; ${message}`)
  }

  #setPermission (resource, spec, rights) {
    const permission = new Permission({
      domain: this.domain,
      parent: this,
      target: this.parent,
      resource,
      spec
    }), { right } = permission
    
    let permissions = rights.get(right)
    
    if (!permissions) {
      permissions = new Set
      rights.set(right, permissions)
    }

    permissions.add(permission)
    return permission
  }
}