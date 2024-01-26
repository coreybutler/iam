import Component from './Component.js'
import { ACCESS_KEY, throwError } from './utilities.js'

export default class Manager extends Component {
  #ItemConstructor
  #map = new Map
  #namespace
  #type

  constructor ({ type, namespace, domain, parent = null, ItemConstructor, items }) {
    super({ type, domain, parent: parent ?? domain })
    
    this.#ItemConstructor = ItemConstructor
    this.#namespace = namespace
    this.#map
    this.#type = type

    for (const item of items ?? []) {
      this.add(item)
    }  
  }

  get count () {
    return this.#map.size
  }

  get data () {
    return [...this.#map.values()].map(item => item.data)
  }

  get items () {
    return [...this.#map.values()]
  }

  add (config) {
    const item = new this.#ItemConstructor({
      domain: this.domain,
      parent: this,
      ...(typeof config === 'string' ? { name: config } : config)
    }), { name } = item

    this.#map.has(name)
      ? throwError(this.domain, `${this.#type} "${name}" already exists`)
      : this.#map.set(name, item)

    this.parent.emit(ACCESS_KEY, `${this.#namespace}.add`)
    return item
  }

  find (filterFn) {
    return [...this.#map.values()].filter(filterFn)
  }

  get = name => this.#map.get(name)
  has = name => this.#map.has(name)

  remove (name) {
    const item = this.get(name)

    item
      ? this.#map.delete(name)
      : throwError(this.domain, `Cannot remove ${this.#type} "${name}" from ${this.parent.type} "${this.parent.name}"; "${name}" is not associated with "${this.parent.name}"`)

    this.parent.emit(ACCESS_KEY, `${this.#namespace}.remove`)
  }
}