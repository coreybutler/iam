import Component from './Component.js'

export default class RightRelationshipManager extends Component {
  #criteria
  #resources = new Map

  constructor (system, parent, criteria) {
    super(system, parent)
    this.#criteria = criteria
  }

  // TODO: Check against criteria
  set (resource, spec) {
    if (!this.system.hasResource(resource)) return this.#logMissingResourceError('set', spec, resource)

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

  unset (resource, spec) {
    if (!this.system.hasResource(resource)) return this.#logMissingResourceError('unset', spec, resource)
    
    const rights = this.#resources.get(resource),
          [relationship, right] = spec.includes(':') ? spec.split(':') : ['allow', spec]

    if (!rights) return this.system.logError(
      `Cannot unset Right "${relationship}:${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; Resource "${resource}" is not associated with ${this.parent.type} "${this.parent.name}".`
    )

    const relationships = rights.get(right)

    if (!relationships) return this.#logUnsetRightError(spec, resource, `Right "${right}" is not associated with ${this.parent.type} "${this.parent.name}"`)
    if (!relationships.has(relationship)) return this.#logUnsetRightError(spec, resource, `Relationship "${relationship}" has not been associated with Right "${right}" on this ${this.parent.type}.`)

    relationships.delete(relationship)
  }

  #logMissingResourceError = (action, spec, resource) => this.system.logError(`Cannot ${action} Right "${spec}" on unknown Resource "${resource}".`)

  #logUnsetRightError = (right, resource, message) => this.system.logError(
    `Cannot unset Right "${right}" from ${this.parent.type} "${this.parent.name}" on Resource "${resource}"; ${message}`
  )
}