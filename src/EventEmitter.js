export default class EventEmitter {
  #listeners = new Map

  once () {

  }

  emit = async (evt, ...args) => await Promise.all((this.#listeners.get(evt) ?? []).map(handler => handler(...args)))
  on = (evt, handler) => this.#listeners.set(evt, [...(this.#listeners.get(evt) ?? []), handler])
}