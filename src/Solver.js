import Entity from './Entity.js'
import { getTrumpingPermission, throwError, warn } from './utilities.js'
import Permission from './Permission.js'
import ACL from './ACL.js'

export default class Solver extends Entity {
  #acls = new Map
  #permissions = new Map
  #roles = new Set
  #suppressEvents = true
  #weights

  constructor ({ type, domain, parent, name, description, permissions = {}, roles = [], ttl, weights, internalEvents = [] }) {
    super({ type, domain, parent, name, description, ttl, internalEvents })

    this.#weights = weights

    for (const role of roles) {
      this.addRole(role)
    }

    for (const [resource, permission] of Object.entries(permissions)) {
      [...(Array.isArray(permission) ? permission : [permission])].forEach(permission => this.#addPermission({ resource, permission }))
    }

    this.#suppressEvents = false
  }

  get data () {
    return {
      ...super.data,
      roles: this.roles,
      permissions: this.permissions
    }
  }

  get permissions () {
    return this.#getTrumpingDirectPermissions(true)
  }

  get roles () {
    return [...this.#roles]
  }

  get weights () {
    return { ...this.#weights }
  }

  addPermission (resource, permission) {
    return this.#addPermission({ resource, permission })
  }

  addRole (name, prepend = false) {
    // const role = this.domain.getRole(name)
    
    // if (!role) return throwError(this.domain, `Cannot add non-existent Role "${name}" to ${this.type} "${this.name}"`)

    prepend ? this.#roles = new Set([name, ...this.#roles]) : this.#roles.add(name)
    !this.#suppressEvents && this.emit('role.add', name)
  }
 
  getACL (resource) {
    let acl = this.#acls.get(resource)

    if (!acl) {
      acl = new ACL(this, resource)
      this.#acls.set(resource, acl)
    }

    return acl
  }

  getDirectPermission (resource, right) {
    return this.#get(...arguments, this.#getTrumpingDirectPermission, this.#getTrumpingDirectPermissionByRight)
  }

  getDirectPermissions (resource, right = null) {
    return this.#get(resource, right, this.#getDirectPermissions, this.#getDirectPermissionsByRight)
  }

  getIndirectPermission (resource, right) {
    return this.#get(...arguments, this.#getTrumpingIndirectPermission, this.#getTrumpingIndirectPermissionByRight)
  }

  getIndirectPermissions (resource, right = null) {
    return this.#get(resource, right, this.#getIndirectPermissions, this.#getIndirectPermissionsByRight)
  }

  getPermission (resource, right) {
    return this.#get(...arguments, this.#getTrumpingPermission, this.#getTrumpingPermissionByRight)
  }

  getPermissions (resource, right = null) {
    return resource
      ? this.#get(resource, right, this.#getPermissions, this.#getPermissionsByRight)
      : this.#getTrumpingPermissions()
  }

  hasDirectPermission (resource, spec) {
    return this.#hasPermission(...arguments, this.#getDirectPermissions)
  }

  hasIndirectPermission (resource, spec) {
    return this.#hasPermission(...arguments, this.#getIndirectPermissions)
  }

  hasPermission (resource, spec) {
    return this.hasDirectPermission(...arguments) || this.hasIndirectPermission(...arguments)
  }

  hasDirectRole (role) {
    return this.#roles.has(role)
  }

  hasIndirectRole (role) {
    return [...this.#roles].some(name => this.domain.getRole(name).hasRole(role))
  }

  hasRole (role) {
    return this.hasDirectRole(role) || this.hasIndirectRole(role)
  }

  isAuthorized (resource, right) {
    return this.getACL(resource).allows(right)
  }

  removePermission (resource, permission) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('remove', spec, resource)

    const rights = this.#permissions.get(resource)

    if (!rights) return

    const [type, right] = permission.includes(':') ? permission.split(':') : ['allow', permission],
          permissions = rights.get(right),
          spec = `${type}:${right}`
    
    let removed = []

    permissions.forEach(permission => {
      if (permission.matches(spec)) {
        permissions.delete(permission)
        removed.push(permission.toString())
      }
    })

    removed.length > 0 && this.emit('permissions.remove', removed)
  }

  removeRole (name) {
    this.#roles.has(name)
      ? this.#roles.delete(name) && this.emit('role.remove', name)
      : throwError(this.domain, `Cannot unnasign Role "${name}" from ${this.type} "${this.name}". This Role is not assigned to this ${this.type}.`)
  }

  replacePermission (resource, permission, spec) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('remove', spec, resource)

    this.removePermission(resource, permission)
    this.addPermission(resource, spec)
  }

  #addPermission ({ resource, permission: spec }) {
    if (!this.domain.hasResource(resource)) return this.#throwMissingResourceError('add', spec, resource)
    if (this.hasDirectPermission(resource, spec)) return warn(`${this.type} "${this.name}" already has permission "${spec}"`)

    const rights = this.#permissions.get(resource) ?? new Map
    rights.size === 0 && this.#permissions.set(resource, rights)

    const permission = new Permission({
      domain: this.domain,
      parent: this,
      resource,
      spec
    }), { right } = permission

    rights.set(right, (rights.get(right) ?? new Set()).add(permission))
    !this.#suppressEvents && this.emit('permission.add', ...arguments)

    return permission
  }

  #get (resource, right, permissionCallback, rightCallback) {
    return !right || right.includes(':')
      ? permissionCallback.call(this, { resource, spec: right })
      : rightCallback.call(this, { resource, right })
  }

  #getDirectPermissions ({ resource, spec }) {
    return spec
      ? this.#getMatchingPermissions(this.#getDirectPermissionsByResource(resource), spec)
      : this.#getDirectPermissionsByResource(resource)
  }

  #getDirectPermissionsByResource (resource) {
    return [...(this.#permissions.get(resource)?.values() ?? [])].flatMap(set => [...set]) ?? []
  }

  #getDirectPermissionsByRight ({ resource, right }) {
    return this.#permissions.get(resource)?.get(right) ?? []
  }

  #getIndirectPermissions ({ resource, spec }) {
    return spec ? this.#getMatchingPermissions(
      this.#getIndirectPermissionsByRight({ resource, right: spec.split(':')[1].trim() }),
      spec
    ) : this.#getIndirectPermissionsByResource(resource)
  }

  #getIndirectPermissionsByResource (resource) {
    return this.#getRolePermissions(resource)
  }

  #getIndirectPermissionsByRight ({ resource, right }) {
    return this.#getRolePermissions(resource, right)
  }

  #getMatchingPermissions (permissions, spec) {
    return permissions.filter(permission => permission.matches(spec))
  }

  #getPermissions ({ resource, spec }) {
    return spec ? [
      ...this.#getDirectPermissions(...arguments),
      ...this.#getIndirectPermissions(...arguments)
    ] : this.#getPermissionsByResource(resource)
  }

  #getPermissionsByResource (resource) {
    return [
      ...this.#getDirectPermissionsByResource(resource),
      ...this.#getIndirectPermissionsByResource(resource)
    ]
  }

  #getPermissionsByRight ({ resource, right }) {
    return right ? [
      ...this.#getDirectPermissionsByRight(...arguments),
      ...this.#getIndirectPermissionsByRight(...arguments)
    ] : this.#getPermissionsByResource(resource)
  }

  #getRolePermissions (resource, right) {
    return [...this.#roles].flatMap(role => this.domain.getRole(role)?.getPermissions(...arguments) ?? [])
  }

  #getTrumpingPermission ({ resource, spec }) {
    return getTrumpingPermission(
      ...this.#getTrumpingDirectPermission(...arguments),
      ...this.#getTrumpingIndirectPermission(...arguments)
    )
  }

  #getTrumpingPermissionByRight ({ resource, right }) {
    return getTrumpingPermission(
      this.#getTrumpingDirectPermissionByRight(...arguments),
      this.#getTrumpingIndirectPermissionByRight(...arguments)
    )
  }

  #getTrumpingDirectPermission ({ resource, spec }) {
    return getTrumpingPermission(...this.#getDirectPermissions(...arguments))
  }

  #getTrumpingDirectPermissionByRight ({ resource, right }) {
    return getTrumpingPermission(...this.#getDirectPermissionsByRight(...arguments))
  }

  #getTrumpingIndirectPermission ({ resource, spec }) {
    return getTrumpingPermission(...this.#getIndirectPermissions(...arguments))
  }

  #getTrumpingIndirectPermissionByRight ({ resource, right }) {
    return getTrumpingPermission(...this.#getIndirectPermissionsByRight(...arguments))
  }

  #getTrumpingDirectPermissions (asString = false) {
    return Object.fromEntries(this.domain.resources.reduce((result, { name: resource, rights }) => {
      const permissions = this.#getDirectPermissionsByResource(resource)

      permissions.length > 0 && result.push([resource, rights.reduce((result, { name }) => {
        const trump = getTrumpingPermission(...permissions.filter(({ right }) => right === name))
        trump && result.push(asString ? trump.toString() : trump)
        return result
      }, [])])

      return result
    }, []))
  }

  #getTrumpingPermissions (asString = false) {
    return Object.fromEntries(this.domain.resources.reduce((result, { name: resource, rights }) => {
      const permissions = this.#getPermissionsByResource(resource)

      permissions.length > 0 && result.push([resource, rights.reduce((result, { name }) => {
        const trump = getTrumpingPermission(...permissions.filter(({ right }) => right === name))
        trump && result.push(asString ? trump.toString() : trump)
        return result
      }, [])])

      return result
    }, []))
  }

  #hasPermission (resource, spec, method) {
    if (!spec.includes(':')) spec = `allow:${spec}`
    return this.#getMatchingPermissions(method.call(this, { resource, spec }), spec).length > 0
  }

  #throwMissingResourceError (action, permission, resource) {
    return throwError(this.domain, `Cannot ${action} Right "${permission}" on unknown Resource "${resource}".`)
  }
}

// getLineage (resource, right) {
  //   let path = [],
  //       permission = getTrumpingPermission(...this.#getDirectPermissions({ resource, right }))
        
  //   if (!permission) {
  //     permission = getTrumpingPermission(...this.#getInheritedPermissions({ resource, right }))
      
  //     if (permission) {
  //       const { parent } = permission

  //       path.push(parent.toString())

  //       if (!this.#roles.has(parent.name)) {
  //         const { name } = parent

  //         for (let role of [...this.#roles]) {
  //           role = this.domain.getRole(role)

  //           if (role.hasDirectRole(name)) {
  //             path.push(role.toString())
  //             break
  //           } else if (role.hasInheritedRole(name)) {
  //             console.log('DO RECURSION')
  //           }
  //         }
  //       }
  //     }
  //   }

  //   return permission ? Object.freeze(new Lineage(this, permission, path)) : null
  // }

  // #throwUnsetRightError (right, resource, message) {
  //   return throwError(this.domain, `Cannot unset Right "${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; ${message}`)
  // }