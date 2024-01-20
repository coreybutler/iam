import Entity from './Entity.js'
import AuthorizationManager from './AuthorizationManager.js'

export default class AuthorizationManagingEntity extends Entity {
  #authorizations

  constructor (type, domain, parent, { name, description, rights = {}, ttl }, weights) {
    super(type, domain, parent, { name, description, ttl })

    this.#authorizations = new AuthorizationManager(domain, this, weights)

    const set = (...args) => this.#authorizations.set(...args)

    for (const [resource, spec] of Object.entries(rights)) {
      Array.isArray(spec)
        ? spec.forEach(spec => set(resource, spec))
        : set(resource, spec)
    }
  }

  isAuthorized (resource, right) {
    return this.#authorizations.has(resource, right)
  }

  setRight = (resource, spec) => this.#authorizations.set(resource, spec)
  unsetRight = (resource, name) => this.#authorizations.unset(resource, name)

  toJSON () {
    return {
      ...super.toJSON(),
      rights: this.#authorizations.toJSON()
    }
  }
}