import Entity from './Entity.js'
import RightManager from './RightManager.js'

export default class Resource extends Entity {
  #rights

  constructor (domain, parent, { name, description, rights = [] }) {
    super ('Resource', domain, parent, { name, description })

    this.#rights = new RightManager(domain, this)

    for (const right of rights) {
      this.#rights.add(right)
    }
  }

  get associatedGroups () {
    return this.domain.findGroups({ resource: this.name })
  }

  get associatedRoles () {
    return this.domain.findRoles({ resource: this.name })
  }

  get associatedUsers () {
    return this.domain.findUsers({ resource: this.name })
  }

  get rights () {
    return this.#rights.toJSON()
  }

  addRight = cfg => this.#rights.add(cfg)
  destroy = () => this.domain.removeResource(this.name)
  getRight = name => this.#rights.get(name)
  hasRight = name => ['*', 'all'].includes(name) ?? this.#rights.has(name)
  removeRight = name => this.#rights.remove(name)

  toJSON () {
    return {
      ...super.toJSON(),
      rights: this.rights
    }
  }
}