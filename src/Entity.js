import Component from './Component.js'

export default class Entity extends Component {
  #description
  #id = crypto.randomUUID()
  #name
  #timer
  #ttl = null

  constructor (type, domain, parent, { name, description = '', ttl = null } = {}) {
    super(type, domain, parent, ttl)
    this.#description = description
    this.#name = name ?? this.logError(`"name" property is required.`)
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

  toJSON () {
    return {
      description: this.description,
      // id: this.id,
      name: this.name
    }
  }

  toString = () => JSON.stringify(this.toJSON())
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