import Base from './base.js'
import { REGISTRY_ID } from './utilities.js'

export default class Manager extends Base {
  // Map of Set objects. Each set represents the actions
  // associated with the resource.
  #items = new Map()
  #named = new Map()
  #fn
  #registry

  constructor (cfg = {}) {
    if (typeof cfg === 'function') {
      cfg = { fn: cfg }
    }

    const fn = cfg.fn
    cfg.type = cfg.type || fn.name.toLowerCase()
    delete cfg.fn

    super(cfg)

    this.#fn = fn

    Object.defineProperties(this, {
      registry: {
        get () { return this.#registry },
        set (v) { this.#registry = v }
      }
    })
  }

  get data () {
    const result = super.data
    result[`${this.type}s`] = Array.from(this.#items.values()).map(item => item.data)

    return result
  }

  /**
   * @property {Object[]}
   * A representation of the system items.
   */
  get items () {
    return Array.from(this.#items.keys()).map(s => this.#items.get(s))
  }

  /**
   * @property {String[]}
   * The names of system resources
   */
  get list () {
    return Array.from(this.#named.keys())
  }

  get size () {
    return this.#items.size
  }

  add () {
    for (const item of arguments) {
      if (item.type !== this.type || !(item instanceof this.#fn)) {
        throw new Error(`Cannot add a "${item.type}" item to a "${this.type}" manager.`)
      }

      if (!this.#items.has(item.OID)) {
        this.#items.set(item.OID, item)
        this.#named.set(item.name, item.OID)
        item.on('name.modified', delta => {
          this.#named.delete(delta.old)
          this.#named.set(delta.new, item.OID)
        })
        this.emit(`${this.type}.create`, this.#items.get(item.OID))
      }
    }
  }

  has (name) {
    return this.#named.has(name) || this.#items.has(name)
  }

  get (name) {
    if (this.#named.has(name)) {
      return this.#items.get(this.#named.get(name))
    }

    return null
  }

  create () {
    const item = new this.#fn(...arguments)

    this.add(item)

    return item
  }

  delete () {
    const args = arguments.length === 0 ? Array.from(this.#items.values()) : arguments

    for (const item of args) {
      const lookup = this.get(typeof item === 'string' ? item : item.name)

      if (lookup) {
        const destroyed = lookup

        this.#named.delete(lookup.name)
        this.#items.delete(lookup.OID)
        this.emit(`${this.type}.destroy`, destroyed)

        if (typeof lookup.destroy === 'function') {
          lookup.destroy()
        }
      }
    }
  }

  reset () {
    this.#items = new Map()
    this.#named = new Map()
    globalThis[REGISTRY_ID].everyone()
    super.reset()
  }
}
