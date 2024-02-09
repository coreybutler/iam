import Component from './Component.js'
import { throwError } from './utilities.js'

export default class Entity extends Component {
  #description
  #name
  #oid

  constructor ({ type, domain, parent = null, name, description = '', ttl = null, internalEvents = [] }) {
    super({ type, domain, parent, ttl, internalEvents })
    this.#description = description
    this.#name = name ?? throwError(`"name" property is required.`)
    this.#oid = Symbol(`${domain ? `${domain.name} ` : ''}${type.toUpperCase()} ${name}`)
  }

  get data () {
    return {
      description: this.description,
      name: this.name,
      type: this.type
    }
  }

  get description () {
    return this.#description
  }

  get name () {
    return this.#name
  }

  /**
   * @getter oid
   * @alias of this.OID
   */
  get oid () {
    return this.#oid
  }

  get OID () {
    return this.#oid
  }

  toString = () => JSON.stringify(this.data)
}