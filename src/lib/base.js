import { hiddenconstant, REGISTRY_ID, capitalize } from './utilities.js'

const elements = new Map()
function generateId (type) {
  const id = (elements.get(type) || 0) + 1
  elements.set(type, id)
  return id
}

export default class Base {
  #oid
  #name
  #description
  #type = 'component'
  #listeners = new Map()
  #relay = new Set()
  #ttl = null
  #expirationTimer

  constructor (cfg = {}) {
    if (cfg.type) {
      this.#type = cfg.type
    }

    this.#name = cfg.name || 'Unknown'
    this.#description = cfg.description || ''

    if (typeof this.#name === 'symbol') {
      this.#oid = this.#name
      this.#name = /^.+\((.+)\)$/.exec(this.#name.toString())[1] || 'Unknown'
    } else {
      this.#oid = typeof this.#name === 'symbol' ? this.#name : Symbol.for(`iam ${this.#name.name ? this.#name.name : this.#name} ${this.#type}`.trim().toLowerCase().replace(/(unknown(\s+)user)/i, this.type + ' ' + generateId(this.type)))
    }

    Object.defineProperties(this, {
      OID: { get: () => this.#oid },
      type: { get: () => this.#type },
      register: hiddenconstant(() => globalThis[REGISTRY_ID].emit(`${this.#type}.create`, this))
    })
  }

  get name () {
    return this.#name
  }

  set name (value) {
    if (value !== null) {
      if (typeof value !== 'string') {
        throw new Error(`Cannot supply a ${typeof value} value as a name (requires string).`)
      }
    }

    if (value !== this.#name) {
      const old = this.#name
      this.#name = typeof value === 'string' && value.trim().length > 0 ? value : 'Untitled'
      this.emit('name.modified', { old, new: value })
    }
  }

  get description () {
    return this.#description || ''
  }

  set description (value) {
    if (value !== null) {
      if (typeof value !== 'string') {
        throw new Error(`Cannot supply a ${typeof value} value as a description (requires string).`)
      }
    }

    if (value !== this.#description) {
      const old = this.#description
      this.#description = typeof value === 'string' && value.trim().length > 0 ? value : ''
      this.emit('description.modified', { old, new: value })
    }
  }

  get data () {
    return {
      name: this.#name,
      description: this.description,
      type: this.#type
    }
  }

  /**
   * @property {number|Date} TTL
   * The **T**ime**T**o**L**ive value. This can be a number
   * (milliseconds from now) or a specific datetime. Once this
   * time has passed, the user will be removed from the system.
   * Setting this to `null`, a value <= 0, or a date in the
   * past will immediately remove the user (immediate expiration).
   */
  set TTL (value) {
    const old = this.#ttl

    if (value instanceof Date) {
      value = value.getTime() - (new Date()).getTime()
    }

    if (isNaN(value) || value <= 0) {
      this.#ttl = null
      clearTimeout(this.#expirationTimer)
      this.emit('ttl', { old, new: this.#ttl })
      return
    }

    this.#ttl = value
    this.#expirationTimer = setTimeout(() => {
      this.#ttl = null
      this.emit('expire', this)

      // The removal occurs on the next tick (slight delay) in order to
      // provide expiration event handlers a chance to renew
      // the TTL
      setTimeout(() => {
        if (this.#ttl === null) {
          globalThis[REGISTRY_ID][`remove${capitalize(this.type)}`](this)
        }
      }, 1)
    }, this.#ttl)

    this.emit('ttl', { old, new: this.#ttl })
  }

  on (eventName, handler) {
    if (this.#listeners) {
      const handlers = this.#listeners.get(eventName) || []
      handlers.push(handler)
      this.#listeners.set(eventName, handlers)
    }
  }

  once (eventName, handler) {
    if (this.#listeners) {
      const me = this
      const handlers = this.#listeners.get(eventName) || []
      const index = handlers.length
      const fn = function () {
        handler.apply(me, arguments)
        me.#listeners.set(eventName, handlers.splice(index, 1))
      }

      this.on(eventName, fn)
    }
  }

  emit (eventName) {
    if (this.#listeners) {
      const args = Array.from(arguments).slice(1)
      const handlers = this.#listeners.get(eventName) || []

      for (const handler of handlers) {
        handler(...args)
      }

      for (const relay of this.#relay) {
        const name = ([relay.prefix, eventName, relay.postfix]).filter(i => i.trim().length > 0).join('.')
        relay.emitter.emit(name, ...args)
      }
    }
  }

  relay (emitter, prefix = '', postfix = '') {
    this.#relay && this.#relay.add({ emitter, prefix, postfix })
  }

  destroy () {
    this.#listeners = null
    this.#relay = null
    this.emit('destroy', this)
    globalThis[REGISTRY_ID].emit(`${this.type}.destroyed`, this)
  }

  reset () {
    this.#listeners = new Map()
    this.#relay = new Set()
    this.#ttl = null
    clearTimeout(this.#expirationTimer)
    this.emit(`${this.type}.reset`, this)
  }
}
