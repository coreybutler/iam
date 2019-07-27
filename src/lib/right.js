import IAM from '../main.js'

export default class Right {
  #oid = Symbol('right')
  #granted = true
  #overridable = true
  #name = null
  #displayName = null
  #description = null

  constructor (name) {
    this.#displayName = name.trim()
    this.#oid = Symbol(name.trim().toLowerCase())

    let permission = Right.Parser.exec(name.trim())

    if (permission === null) {
      throw new Error(`"${name}" is an invalid right. All rights must be non-null, named values.`)
    }

    this.#overridable = permission[2] === 'allow'
    this.#granted = !(permission[2] === 'deny')

    this.#name = permission.pop().trim().toLowerCase()
  }

  static get Parser () {
    return /^((allow|deny)\:)?(.+)$/gi
  }

  get OID () {
    return this.#oid
  }

  get title () {
    return this.#displayName
  }

  get name () {
    return this.#name
  }

  get all () {
    return this.#name === '*'
  }

  get allowed () {
    return this.#granted
  }

  get denied () {
    return !this.#granted
  }

  get description () {
    return this.#description || 'No description available.'
  }

  set description (value) {
    this.#description = value.trim()
  }

  get force () {
    return this.#overridable
  }

  get data () {
    return {
      name: this.#name,
      description: this.#description ||  `${this.allowed ? 'Grant' : 'Deny'} ` + (this.all ? `all privileges.` : `${this.#name} privilege.`),
      right: this.#displayName,
      allowed: this.allowed
    }
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

    return this.#name === name
  }
}
