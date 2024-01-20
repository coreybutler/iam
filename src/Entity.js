import Component from './Component.js'

export default class Entity extends Component {
  #description
  #name

  constructor (type, domain, parent, { name, description = '', ttl = null } = {}) {
    super(type, domain, parent, ttl)
    this.#description = description
    this.#name = name ?? this.logError(`"name" property is required.`)
  }

  get description () {
    return this.#description
  }

  get name () {
    return this.#name
  }

  toJSON () {
    return {
      description: this.description,
      // id: this.id,
      name: this.name
    }
  }

  toString = () => JSON.stringify(this.toJSON())
}