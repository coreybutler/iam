import Entity from './Entity.js'
import RightRelationshipManager from './RightRelationshipManager.js'

export default class RightRelationshipManagingEntity extends Entity {
  #rights

  constructor (type, system, parent, { name, description, rights = {} }, criteria) {
    super(type, system, parent, { name, description })

    this.#rights = new RightRelationshipManager(system, this, criteria)

    for (const entry of Object.entries(rights)) {
      this.#rights.set(...entry)
    }
  }

  setRight = (resource, spec) => this.#rights.set(resource, spec)
  unsetRight = (resource, name) => this.#rights.unset(resource, name)
}