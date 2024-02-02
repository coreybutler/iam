import Entity from './Entity.js'
import { getTrumpingPermission, throwError } from './utilities.js'
import Permission from './Permission.js'
import ACL from './ACL.js'

export default class Solver extends Entity {
  #acls = new Map
  #permissions = new Map
  #roles = []
  #weights

  constructor ({ type, domain, parent, name, description, permissions = {}, roles = [], ttl, weights, internalEvents = [] }) {
    super({ type, domain, parent, name, description, ttl, internalEvents })

    this.#roles = new Set(roles)
    this.#weights = weights
    
    for (const [resource, permission] of Object.entries(permissions)) {
      [...(Array.isArray(permission) ? permission : [permission])].forEach(permission => this.#setPermission({ resource, permission }, true))
    }
  }

  get data () {
    return {
      ...super.data,
      roles: [...this.#roles],
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

  get roles () {
    return [...this.#roles]
  }

  get weights () {
    return this.#weights
  }

  assignRole (name, prepend = false) {
    prepend ? this.#roles = new Set([name, ...this.#roles]) : this.#roles.add(name)
  }

  unassignRole (name) {
    this.#roles.has(name)
      ? this.#roles.delete(name) && this.emit('role.unassign', name)
      : throwError(this.domain, `Cannot unnasign Role "${name}" from ${this.type} "${this.name}". This Role is not assigned to this ${this.type}.`)
  }

  getACL (resource, refresh = false) {
    let acl = this.#acls.get(resource)

    if (!acl || refresh) {
      acl = new ACL(this, resource)
      this.#acls.set(resource, acl)
    }

    return acl
  }

  getLineage (resource, right) {
    const entity = `${this.type} "${this.name}"`,
          permission = getTrumpingPermission(...this.getPermissions(...arguments)),
          { parent } = permission,
          action = `${permission.allows ? 'granted' : 'denied'} the "${right}" Right on the "${resource}" Resource`,
          application = `the Permission "${permission.toString()}"`

    if (!permission) return `${entity} does not have "${right}" permission on the "${resource}" Resource.`
    if (parent === this) return `${entity} is directly ${action} via ${application}`

    return `${entity} is ${action} via the Role "${parent.name}" which applies ${application}`
  }

  getPermissions (resource, right) {
    return this.#getPermissions({ resource, right })
  }

  #getPermissions ({ resource, right, asString = false }) {
    const permissions = [
      ...this.#getLocalPermissions({ resource, right }),
      ...[...this.#roles].flatMap(role => this.domain.getRole(role)?.getPermissions(resource, right) ?? [])
    ]

    return asString ? permissions.map(permission => permission.toString()) : permissions
  }

  #getLocalPermissions ({ resource, right }) {
    const permissions = this.#permissions.get(resource)

    return right
      ? (permissions?.get(right) ?? [])
      : ([...permissions?.values() ?? []].flatMap(permissions => [...permissions]) ?? [])
  }

  isAuthorized (resource, right) {
    return this.getACL(resource).allows(right)
  }

  setPermission (resource, permission) {
    return this.#setPermission({ resource, permission })
  }

  #setPermission ({ resource, permission: spec }, silenceEvents = false) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('set', spec, resource)

    const rights = this.#permissions.get(resource) ?? new Map
    rights.size === 0 && this.#permissions.set(resource, rights)

    const permission = new Permission({
      domain: this.domain,
      parent: this,
      resource,
      spec
    }), { right } = permission

    rights.set(right, (rights.get(right) ?? new Set()).add(permission))
    !silenceEvents && this.emit('permission.set', ...arguments)

    return permission
  }

  #throwMissingResourceError (action, permission, resource) {
    return throwError(this.domain, `Cannot ${action} Right "${permission}" on unknown Resource "${resource}".`)
  }

  #throwUnsetRightError (right, resource, message) {
    return throwError(this.domain, `Cannot unset Right "${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; ${message}`)
  }
}