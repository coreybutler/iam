import Component from './Component.js'

export default class Entity extends Component {
  #description
  #id = crypto.randomUUID()
  #name
  #type

  constructor (type, system, parent, { name, description = '' } = {}) {
    super(system, parent)
    this.#description = description
    this.#name = name ?? `${type} ${this.#id}`
    this.#type = type
  }

  get description () {
    return this.#description
  }

  get id () {
    return this.#id
  }

  get name () {
    return this.#name
  }

  get type () {
    return this.#type
  }

  toJSON () {
    return {
      description: this.description,
      id: this.id,
      name: this.name
    }
  }

  toString = () => JSON.stringify(this.toJSON())
}