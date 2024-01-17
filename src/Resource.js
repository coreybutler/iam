import Entity from './Entity.js'
import RightManager from './RightManager.js'

export default class Resource extends Entity {
  #rights

  constructor (system, parent, { name, description, rights = [] }) {
    super ('Resource', system, parent, { name, description })

    this.#rights = new RightManager(system, this)

    for (const right of rights) {
      this.#rights.add(right)
    }
  }

  get rights () {
    return this.#rights.toJSON()
  }

  addRight = cfg => this.#rights.add(cfg)
  hasRight = name => ['*', 'all'].includes(name) ?? this.#rights.has(name)
  removeRight = name => this.#rights.remove(name)

  toJSON () {
    return {
      ...super.toJSON(),
      rights: this.rights
    }
  }
}