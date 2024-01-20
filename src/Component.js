import EventEmitter from './EventEmitter.js'

export default class Component extends EventEmitter {
  #id = crypto.randomUUID()
  #domain
  #parent
  #type
  #timer
  #ttl = null

  constructor (type, domain, parent, ttl) {
    super()
    this.#domain = domain
    this.#parent = parent
    this.#type = type
    ttl && (this.TTL = ttl)
  }

  get id () {
    return this.#id
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

  set ttl (val) {
    this.TTL = val
  }

  set TTL (val) {
    if (val instanceof Date) val = val.getTime() - (new Date).getTime()

    const previous = this.#ttl

    if (isNaN(val) || val <= 0) {
      this.#destroyTimer()
      this.#ttl = null
    } else {
      this.#setTimer(val)
      this.#ttl = val
    }

    return this.emit('ttl.change', { previous, current: this.#ttl })
  }

  destroy () {
    console.log('DESTROY', this)
    // Fire destroy event
  }

  #destroyTimer = () => clearTimeout(this.#timer)

  #setTimer (ttl) {
    this.#timer = setTimeout(async () => {
      let renewal

      await this.emit('expire', {
        renew: ttl => renewal = ttl
      })

      return renewal ? (this.TTL = renewal) : this.destroy()
    }, ttl)
  }
}