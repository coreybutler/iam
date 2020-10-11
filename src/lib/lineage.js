import Right from './actors/right.js'
import Role from './actors/role.js'
import { getGroup, getResource } from './utilities.js'

export default class Lineage {
  #name
  #role = null
  #group = null
  #resource = null
  #right = null
  #granted = true
  #forced = false
  #stack = []
  #permission = null

  constructor (resource = null, right = null) {
    if (right instanceof Right) {
      right = right.right
    }

    this.#resource = getResource(resource, true)
    this.#permission = right

    this.#name = `${this.#resource.name} ${right} lineage`
  }

  get name () {
    return this.#name
  }

  get type () {
    return 'lineage'
  }

  get granted () {
    return this.#granted
  }

  get denied () {
    return !this.#granted
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

    const role = value.filter(item => item.type === 'role')

    if (value.length > 1 && role.length > 0) {
      this.#role = role.pop()
    }

    this.right = value[value.length - 1]

    if (this.type === 'right' && value.length > 1) {
      value.pop()
    }

    this.#stack = value
  }

  get stack () {
    return this.#stack
  }

  set right (value) {
    if (this.#right === null && value instanceof Right) {
      if (value.is(this.#permission)) {
        this.#right = value
      }
    }
  }

  get forced () {
    return this.#forced
  }

  /**
   * A text-based display of the lineage from
   * source to right. For example:
   *
   * `administrator (role) --> manage (granted)`
   * @return {string} [description]
   */
  get display () {
    const stack = this.stack.slice()

    if (stack.length === 0) {
      return 'everyone (group)'
    }

    let groups = 0
    return stack.map((item, index, currentStack) => {
      if (item instanceof Role) {
        return `${item.name} (role)`
      }

      if (item instanceof Right && item.is(this.#permission)) {
        return `${item.name} (${stack.length === 1 ? 'explicitly ' : ''}${item.denied ? 'right denied' : 'granted'}${item.name === '*' ? ' ' + this.#permission : ''})`
      }

      if (item.type && item.type === 'group') {
        groups++
        return `${item.name} (${groups > 1 ? 'sub' : ''}group)`
      }

      return `${item && item.name ? item.name : item} (${item.type})`
    }).join(' --> ')
  }

  /**
   * @property {string}
   * Returns a description, similar to #display,
   * but in reverse order from right to source.
   */
  get description () {
    const stack = this.stack.slice()

    if (stack.length === 0 || (stack.length === 1 && stack[0] instanceof Role && stack[0].name === 'everyone')) {
      return `All users are ${this.granted ? 'granted' : 'denied'} the "${this.#permission}" right on the "${this.#resource}" resource${stack.length > 0 ? ' by the "everyone" role' : ''}.`
    }

    if (stack.filter(item => item instanceof Right).length === 0) {
      console.error('No rights', this.#stack)
    }

    return (stack.reverse().map((item, index, currentStack) => {
      if (item instanceof Role) {
        return `the "${item.name}" role`
      }

      if (item instanceof Right) {
        return `The "${this.#permission}" right of the "${this.#resource.name}" resource is${stack.length === 1 ? ' explicitly' : ''} ${item.denied ? 'denied' : 'granted'}${stack.length === 1 ? ' to the user' : ''}`
      }

      if (item.type && item.type === 'group') {
        return `${index < currentStack.length ? 'which is inherited from' : 'by'} the "${item.name}" group${index > 0 ? ', which is a member of' : ''}`
      }

      if (item.type && item.type === 'user') {
        return 'USER'
      }

      return `The "${item instanceof Right ? item.name : item}"`
    })
      .join(' by ')
      .replace(/(by which)/gi, ', which')
      .replace(/\s+,/gi, ',')
      .replace(/(member of, which is inherited from)/gi, 'member of') + '.')
      .replace(/(is a member of(\.|\sby\sUSER.+))$/i, 'the user is a member of.')
  }

  get group () {
    if (this.#group) {
      return this.#group
    }

    if (this.#stack[0].type === 'group') {
      this.#group = this.#stack[0]
      return this.#group
    }
  }

  set group (value) {
    const grp = getGroup(value)
    this.#group = grp || this.#group
  }

  set role (value) {
    this.#role = value
  }

  get role () {
    return this.#role
  }

  get resource () {
    return this.#resource
  }

  get data () {
    if (this.#stack.length === 0) {
      return null
    }

    return {
      type: this.#stack[0].type,
      resource: this.#resource.name,
      right: this.#permission,
      granted: this.#granted,
      governedBy: {
        group: this.#group ? this.#group.name : null,
        role: this.#role ? this.#role.name : null,
        right: this.#right.data
      },
      stack: this.stack.map(i => i.data),
      display: this.display,
      description: this.description
    }
  }

  grant (force = false) {
    if (force) {
      this.#forced = true
    }

    this.#granted = true
  }

  deny () {
    this.#granted = false
  }
}
