import User from './lib/user.js'

class Manager {
  constructor () {
    #resources = new Set()
    #roles = new Map()
    #roleMap = new Map() // Map of resources to roles.
  }

  /**
   * Create new resources. This accepts any number of string arguments,
   * where each string represents the unique name of a system resource,
   * asset, or component.
   */
  createResource () {
    this.#resources.add(Array.from(arguments).map(resource => resource.trim().toUpperCase()))
  }

  /**
   * Remove resources. This accepts any number of string arguments,
   * where each string represents the unique name of a system resource,
   * asset, or component.
   */
  removeResource () {
    Array.from(arguments).forEach(resource => this.#resources.delete(resource.trim().toUpperCase()))
  }

  /**
   * Remove all known resources.
   */
  clearResources () {
    this.#resources = new Set()
  }

  /**
   * Create a new IAM role.
   * @param  {string} name
   * Unique name of the role. If the role already exists, it will
   * be overwritten.
   * @param  {Object} [permissions={}]
   * Specify permissions, by resource, assigned to this role.
   *
   * For example:
   * ```
   * IAM.createResource('user admin', 'user portal')
   * IAM.createRole('admin', {
   *   'user admin': ['read', 'write'],
   *   'user portal': ['read']
   * })
   * ```
   */
  createRole (name, permissions = {}) {
    Object.keys(permissions).forEach(resource => {
      if (!this.#resources.has(resource.trim().toUpperCase()) {
        throw new Error(`${resource.trim()} is not a recognized IAM system resource.`)
      }

      permissions[resource] = new Set(permissions[resource].map(permission => permission.trim().toUpperCase()))

      this.#roleMap.set(resource, (this.#roleMap.get(resource) || new Set()).add(permissions[resource]))
    })

    this.#roles.add(name.trim().toUpperCase(), permissions)
  }

  /**
   * Remove roles from the IAM.
   *
   * ```
   * IAM.removeRole('user admin', 'user portal')
   * ```
   */
  removeRole () {
    Array.from(arguments).forEach(role => this.#roles.delete(role.trim().toUpperCase()))
  }

  isAuthorized (user, resource = '', feature = '') {
    if (!(user instanceof User)) {
      throw new Error('Invalid IAM.User specified.')
    }

    if (!this.#resources.has(resource.trim().toUpperCase())) {
      throw new Error(`${resource.trim()} is not a recognized IAM resource.`)
    }

    // Identify the appropriate permissions
    let permissions = this.#resources.get(resource.trim().toUpperCase())

    if (feature === '' && Object.keys(permissions).length > 1) {
      throw new Error('No feature name specified. A feature name must be specified when a resource/role contains multiple features.')
    }

    // If there are no permissions assigned to the feature, the user is not authorized.
    if (!permissions.hasOwnProperty(feature.trim().toUpperCase())) {
      return false
    }

    // Identify the ACL
    let acl = permissions[feature.trim().toUpperCase()]

    // If there is no ACL, the user is not authorized.
    if (acl.size === 0) {
      return false
    }

    // All users are members of the "everyone" group.
    if (acl.has('EVERYONE')) {
      return true
    }

    // If the user has the appropriate permission, they're authorized.
    for (let role of acl) {
      if (user.inRole(role)) {
        return true
      }
    }

    // If everything else fails, the user is not authorized.
    return false
  }

  getResourcePermissions (resource) {
    return this.#roleMap.get(resource)
  }
}

const IAM = new Manager()

export { IAM as default, User }
