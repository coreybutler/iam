import Entity from './Entity.js'
import { getTrumpingPermission, throwError } from './utilities.js'
import Permission from './Permission.js'
import ACL from './ACL.js'
import Lineage from './Lineage.js'

export default class Solver extends Entity {
  #acls = new Map
  #lineage = new Map
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
      permissions: Object.fromEntries([...this.#permissions].map(([resource, permissions]) => {
        return [resource, [...permissions.values()].flatMap(permissions => {
          return [...permissions].map(p => p.toString())
        })]
      }))
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

  getACL (resource) {
    return this.#getCacheable(this.#acls, resource, () => new ACL(this, resource))
  }

  getLineage (resource, right) {
    let path = [],
        permission = getTrumpingPermission(...this.#getDirectPermissions({ resource, right }))
        
    if (!permission) {
      permission = getTrumpingPermission(...this.#getInheritedPermissions({ resource, right }))
      
      if (permission) {
        const { parent } = permission

        path.push(parent.toString())

        if (!this.#roles.has(parent.name)) {
          const { name } = parent

          for (let role of [...this.#roles]) {
            role = this.domain.getRole(role)

            if (role.hasDirectRole(name)) {
              path.push(role.toString())
              break
            } else if (role.hasInheritedRole(name)) {
              console.log('DO RECURSION')
            }
          }
        }
      }
    }

    return permission ? Object.freeze(new Lineage(this, permission, path)) : null
  }

  getPermission (resource, right) {
    return getTrumpingPermission(...this.getPermissions(...arguments))
  }

  getPermissions (resource, right) {
    return this.#getPermissions({ resource, right })
  }

  hasDirectRole (role) {
    return this.#roles.has(role)
  }

  hasInheritedRole (role) {
    return [...this.#roles].some(name => this.domain.getRole(name).hasRole(role))
  }

  hasRole (role) {
    return this.hasDirectRole(role) || this.hasInheritedRole(role)
  }

  isAuthorized (resource, right) {
    return this.getACL(resource).allows(right)
  }

  setPermission (resource, permission) {
    return this.#setPermission({ resource, permission })
  }

  #getCacheable (collection, key, instantiate) {
    let cacheable = collection.get(key)

    if (!cacheable) {
      cacheable = instantiate()
      collection.set(key, cacheable)
    }

    return cacheable
  }

  #getPermissions ({ resource, right, asString = false }) {
    const args = { resource, right },
          permissions = [
            ...this.#getDirectPermissions(args),
            ...this.#getInheritedPermissions(args)
          ]

    return asString ? permissions.map(permission => permission.toString()) : permissions
  }

  #getDirectPermissions ({ resource, right }) {
    const permissions = this.#permissions.get(resource)

    return right
      ? (permissions?.get(right) ?? [])
      : ([...permissions?.values() ?? []].flatMap(permissions => [...permissions]) ?? [])
  }

  #getInheritedPermissions ({ resource, right }) {
    return [...this.#roles].flatMap(role => this.domain.getRole(role)?.getPermissions(resource, right) ?? [])
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