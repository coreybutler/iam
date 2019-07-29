import IAM from '../main.js'
import Right from './right.js'
import Role from './role.js'
import Group from './group.js'

export default class Lineage {
  #role = null
  #group = null
  #resource = null
  #right = null
  #allowed = false
  #forced = false
  #stack = []
  #permission = null

  constructor (resource = null, right = null) {
    this.#resource = resource
    this.#permission = right
  }

  get allowed () {
    return this.#allowed
  }

  get denied () {
    return !this.#allowed
  }

  get hasRole () {
    return this.#role !== null
  }

  get empty () {
    return this.#stack.length < 2
  }

  set stack (value) {
    if (!Array.isArray(value)) {
      value = [value]
    }

    if (value.length > 1 && value[value.length - 2] instanceof Role) {
      this.#role = value[value.length - 2]
    }

    this.right = value[value.length - 1]
    this.#stack = value
  }

  get stack () {
    return this.#stack
  }

  set right (value) {
    if (this.#right === null || value instanceof Right) {
      this.#right = value
    }
  }

  get forced () {
    return this.#forced
  }

  get display () {
    return this.stack.map((item, index, currentStack) => {
      if (item instanceof Role) {
        return `${item.name} (role)`
      }

      if (item instanceof Right) {
        return `${item.name} (${this.denied ? 'denied ' : ''}right to${item.name === '*' ? ' ' + this.#permission : ''})`
      }

      if (item instanceof Group) {
        return `${item.name} (${index > 0 ? 'sub' : ''}group)`
      }

      return `${item} (right)`
    }).join(' <-- ')
  }

  get group () {
    return this.#group
  }

  set group (value) {
    this.#group = value
  }

  set role (value) {
    this.#role = value
  }

  get role () {
    return this.#role
  }

  get data () {
    if (this.#stack.length === 0) {
      return null
    }

    return {
      type: this.#group === null ? 'group' : 'role',
      resource: IAM.getResource(this.#resource),
      right: this.#permission,
      granted: this.#allowed,
      governedBy: {
        group: this.#group,
        role: this.#role,
        right: this.#right
      },
      stack: this.stack,
      display: this.display
    }
  }

  allow (force = false) {
    if (force) {
      this.#forced = true
    }

    this.#allowed = true
  }

  deny () {
    this.#allowed = false
  }
}
