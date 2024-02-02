import { ACCESS_KEY } from './Constants.js'
import { throwError } from './utilities.js'

export default class EventEmitter {
  #internalEvents
  #listeners = new Map

  constructor (internalEvents) {
    this.#internalEvents = new Set(internalEvents)
  }

  once (evt, handler) {
    this.on(evt, async () => {
      this.off(...arguments)
      await handler()
    })
  }

  async emit (evt, ...args) {
    let hasAccess = false

    if (evt === ACCESS_KEY) {
      hasAccess = true
      evt = args.shift()
    }

    return this.#internalEvents.has(evt) && !hasAccess
      ? throwError(this.domain, `${this.type} "${this.name}": "${evt}" event is reserved for internal use.`)
      : await Promise.all([...(this.#listeners.get(evt) ?? [])].map(handler => handler(...args)))
  }

  on (evt, handler) {
    this.#listeners.set(evt, new Set([...(this.#listeners.get(evt) ?? []), handler]))
  }

  off (evt, handler) {
    const listeners = this.#listeners.get(evt)
    listeners && listeners.delete(handler)
  }
}