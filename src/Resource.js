import Entity from './Entity.js'
import RightManager from './RightManager.js'

export default class Resource extends Entity {
  #rights

  constructor ({ domain, parent, name, description, rights = [] }) {
    super ({
      type: 'Resource',
      domain,
      parent,
      name,
      description
    })

    this.#rights = new RightManager({ domain, parent: this, rights })
  }

  get data () {
    return {
      ...super.data,
      rights: this.rights.data
    }
  }

  get rights () {
    return this.#rights.items
  }

  get roles () {
    return this.domain.findRoles({ resource: this.name })
  }

  get users () {
    return this.domain.findUsers({ resource: this.name })
  }

  addRight = cfg => this.#rights.add(cfg)
  destroy = () => this.domain.removeResource(this.name)
  getRight = name => this.#rights.get(name)
  hasRight = name => this.#rights.count > 0 && (['*', 'all'].includes(name) || this.#rights.has(name))
  hasRights = (...rights) => rights.every(right => this.hasRight(right))
  removeRight = name => this.#rights.remove(name)
}