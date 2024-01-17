import Base from '../base.js'

/**
 * Rights are resource permissions, i.e. what a user
 * can or cannot do with/to a specific system resource.
 * For example, the admin portal resource may have
 * `view` and `manage` rights associated with it. Users
 * who are granted `view` rights should be able to see
 * the admin portal, while users with `manage` rights
 * can _do_ something in the admin portal. Users
 * without either of these rights shouldn't see the
 * admin portal at all.
 */
export default class Right extends Base {
  #granted = true
  #overridable = true
  #displayName = null
  #permission = null

  constructor (name) {
    super({ type: 'right' })

    if (Array.isArray(name)) {
      if (name.length > 1) {
        throw new Error(`Cannot construct a new right using an existing right (${name.name})`)
      }

      name = name[0]
    }

    if (typeof name !== 'string') {
      if (name instanceof Right) {
        throw new Error(`Cannot construct a new right using an existing right (${name.name})`)
      }

      if (typeof name === 'object' && (name.right !== undefined || name.name !== undefined)) {
        if (name.granted !== undefined && typeof name.granted === 'boolean') {
          this.#granted = name.granted
        }

        if (name.description !== undefined) {
          this.description = name.description.trim()
        }

        if (name.right !== undefined) {
          name = name.right
        } else {
          name = name.name
        }
      } else {
        throw new Error(`${typeof name} is an invalid right name.`)
      }
    }

    const PARSER = name.trim().split(':')
    const label = PARSER.pop()

    this.#permission = PARSER.length > 0 ? PARSER[0] : null
    this.#displayName = label === '*' ? 'All' : label.trim()
    this.#overridable = this.#permission === 'allow'
    this.#granted = name.granted !== undefined ? this.#granted : this.#permission !== 'deny'

    this.name = label.trim().toLowerCase()
  }

  get title () {
    return this.#displayName
  }

  get all () {
    return this.name === '*'
  }

  get granted () {
    return this.#granted
  }

  get denied () {
    return !this.#granted
  }

  get forced () {
    return this.#overridable
  }

  get data () {
    return Object.assign(super.data, {
      description: this.description || `${this.granted ? 'Grant' : 'Deny'} ` + (this.all ? 'all privileges.' : `${this.name} privilege.`),
      right: ((this.#permission ? `${this.#permission}:` : '') + this.#displayName).trim().toLowerCase(),
      granted: this.granted,
      forced: this.forced
    })
  }

  /**
   * Matches a right by name. This does not account for resource.
   * @param  {string} name
   * Name of the right to compare.
   * @return {boolean}
   */
  is (name) {
    if (name instanceof Right) {
      name = name.name
    }

    // If the right matches everything, return true
    if (this.all) {
      return true
    }

    return this.name.trim() === name.trim()
  }
}
