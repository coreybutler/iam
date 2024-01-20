import Authorization from './Authorization.js'
import Component from './Component.js'

export default class AuthorizationManager extends Component {
  #weights
  #resources = new Map

  constructor (domain, parent, weights) {
    super('Authorization Manager', domain, parent)
    this.#weights = new Map(Object.entries(weights))
  }

  has (resource, right) {
    const rights = this.#resources.get(resource)

    return rights
      ? right ? this.#has(rights, right) : true
      : false
  }

  // TODO: Sort by weights now to avoid having to do it when calling isAuthorized?
  set (resource, spec) {
    if (!this.domain.hasResource(resource)) return this.#logMissingResourceError('set', spec, resource)

    let rights = this.#resources.get(resource)

    if (!rights) {
      rights = new Map
      this.#resources.set(resource, rights)
    }

    return this.#setAuthorization(...arguments, rights)
  }

  toJSON () {
    return Object.fromEntries([...this.#resources.entries()].map(([resource, rights]) => {
      return [resource, [...rights.entries()].reduce((result, [right, authorizations]) => {
        authorizations.forEach(({ type }) => result.push(`${type}:${right}`))
        return result
      }, [])]
    }))
  }

  unset (resource, spec) {
    if (!this.domain.hasResource(resource)) return this.#logMissingResourceError('unset', spec, resource)
    
    const rights = this.#resources.get(resource),
          [authorization, right] = spec.includes(':') ? spec.split(':') : ['allow', spec]

    if (!rights) return this.domain.logError(
      `Cannot unset Right "${authorization}:${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; Resource "${resource}" is not associated with ${this.parent.type} "${this.parent.name}".`
    )

    const authorizations = rights.get(right)

    if (!authorizations) return this.#logUnsetRightError(spec, resource, `Right "${right}" is not associated with ${this.parent.type} "${this.parent.name}"`)
    if (!authorizations.has(authorization)) return this.#logUnsetRightError(spec, resource, `Relationship "${authorization}" has not been associated with Right "${right}" on this ${this.parent.type}.`)

    authorizations.delete(authorization)
  }

  #getTrumpingAuthorization (authorizations) {
    return [...authorizations].sort(({ weight: a }, { weight: b }) => {
      if (a > b) return -1
      if (a < b) return 1

      console.log('MATCH.')
    })[0]
  }

  #has (rights, right) {
    const authorizations = rights.get(right)
    return authorizations ? this.#getTrumpingAuthorization(authorizations).type.includes('allow') : false
  }

  #logMissingResourceError = (action, spec, resource) => this.domain.logError(`Cannot ${action} Right "${spec}" on unknown Resource "${resource}".`)

  #logUnsetRightError = (right, resource, message) => this.domain.logError(
    `Cannot unset Right "${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; ${message}`
  )

  #setAuthorization (resource, spec, rights) {
    let authorization = new Authorization(this.domain, this.parent, resource, spec, this.#weights),
        { right } = authorization,
        authorizations = rights.get(right)
    
    if (!authorizations) {
      authorizations = new Set
      rights.set(right, authorizations)
    }

    authorizations.add(authorization)
    return authorization
  }
}