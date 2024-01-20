import Component from './Component.js'

class Authorization extends Component {

}

export default class AuthorizationManager extends Component {
  #weights
  #resources = new Map

  constructor (domain, parent, weights) {
    super('Authorization Manager', domain, parent)
    this.#weights = weights
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

    const [relationship, right] = spec.includes(':') ? spec.split(':') : ['allow', spec]
    let relationships = rights.get(right)
    
    if (!relationships) {
      relationships = new Set
      rights.set(right, relationships)
    }

    relationships.add(relationship)
  }

  toJSON () {
    return {
      ...Object.fromEntries([...this.#resources.entries()].map(([resource, rights]) => {
        return [resource, [...rights.entries()].reduce((result, [right, relationships]) => {
          result.push(...[...relationships].map(relationship => `${relationship}:${right}`))
          return result
        }, [])]
      }))
    }
  }

  unset (resource, spec) {
    if (!this.domain.hasResource(resource)) return this.#logMissingResourceError('unset', spec, resource)
    
    const rights = this.#resources.get(resource),
          [relationship, right] = spec.includes(':') ? spec.split(':') : ['allow', spec]

    if (!rights) return this.domain.logError(
      `Cannot unset Right "${relationship}:${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; Resource "${resource}" is not associated with ${this.parent.type} "${this.parent.name}".`
    )

    const relationships = rights.get(right)

    if (!relationships) return this.#logUnsetRightError(spec, resource, `Right "${right}" is not associated with ${this.parent.type} "${this.parent.name}"`)
    if (!relationships.has(relationship)) return this.#logUnsetRightError(spec, resource, `Relationship "${relationship}" has not been associated with Right "${right}" on this ${this.parent.type}.`)

    relationships.delete(relationship)
  }

  #getTrumpingAuthorization (authorizations) {
    return [...authorizations].sort((a, b) => {
      a = this.#weights[a]
      b = this.#weights[b]
      
      if (a > b) return -1
      if (a < b) return 1

      console.log('MATCH.')
    })[0]
  }

  #has (rights, right) {
    const authorizations = rights.get(right)
    return authorizations ? this.#getTrumpingAuthorization(authorizations).includes('allow') : false
  }

  #logMissingResourceError = (action, spec, resource) => this.domain.logError(`Cannot ${action} Right "${spec}" on unknown Resource "${resource}".`)

  #logUnsetRightError = (right, resource, message) => this.domain.logError(
    `Cannot unset Right "${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; ${message}`
  )
}