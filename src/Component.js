export default class Component {
  #parent
  #system

  constructor (system, parent) {
    this.#parent = parent
    this.#system = system
  }

  get parent () {
    return this.#parent
  }

  get system () {
    return this.#system
  }
}