import Component from './Component.js'

export default class Manager extends Component {
  #ItemConstructor
  #map = new Map
  #type

  constructor (type, ItemConstructor, system, parent) {
    super(system, parent ?? system)
    this.#ItemConstructor = ItemConstructor
    this.#map
    this.#type = type
  }

  add (cfg) {
    const item = new this.#ItemConstructor(this.system, this.parent, cfg)
    this.#map.set(item.name, item)
    return item
  }

  get = name => this.#map.get(name)
  has = name => this.#map.has(name)

  remove (name) {
    const item = this.get(name)

    return item
      ? this.#map.delete(name)
      // TODO: Throw here?
      : this.system.logError(`Cannot remove ${this.#type} "${name}" from ${this.parent.type} "${this.parent.name}"; "${name}" is not associated with "${this.parent.name}"`)
  }

  toJSON () {
    return [...this.#map.values()].map(item => item.toJSON())
  }
}