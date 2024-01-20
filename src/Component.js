import EventEmitter from './EventEmitter.js'

export default class Component extends EventEmitter {
  #domain
  #parent
  #type

  constructor (type, domain, parent, ttl) {
    super()
    this.#domain = domain
    this.#parent = parent
    this.#type = type
    ttl && (this.TTL = ttl)
  }

  get domain () {
    return this.#domain
  }

  get parent () {
    return this.#parent
  }

  get type () {
    return this.#type
  }

  destroy () {
    console.log('DESTROY', this)
    // Fire destroy event
  }
}