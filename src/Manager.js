import Component from './Component.js'

export default class Manager extends Component {
  #ItemConstructor
  #map = new Map
  #type

  constructor (type, ItemConstructor, domain, parent, items) {
    super(type, domain, parent)
    this.#ItemConstructor = ItemConstructor
    this.#map
    this.#type = type

    for (const item of items ?? []) {
      this.add(item)
    }  
  }

  add (cfg) {
    if (this.#map.has(cfg.name)) return this.domain.logError(`${this.#type} Manager already has a ${this.#type} named "${cfg.name}"`)
    const item = new this.#ItemConstructor(this.domain, this.parent, cfg)
    return (this.#map.set(item.name, item), item)
  }

  create (cfg) {
    console.log(...arguments);
  }

  find (filterFn) {
    return [...this.#map.values()].filter(filterFn)
  }

  get = name => this.#map.get(name)
  has = name => this.#map.has(name)

  remove (name) {
    const item = this.get(name)

    return item
      ? this.#map.delete(name)
      // TODO: Throw here?
      : this.domain.logError(`Cannot remove ${this.#type} "${name}" from ${this.parent.type} "${this.parent.name}"; "${name}" is not associated with "${this.parent.name}"`)
  }

  toJSON () {
    return [...this.#map.values()].map(item => item.toJSON())
  }
}