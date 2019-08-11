import IAM from '../main.js'
import Right from './right.js'
import Role from './role.js'
import Group from './group.js'

export default class Lineage {
  #role = null
  #group = null
  #resource = null
  #right = null
  #allowed = true
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

    let role = value.filter(item => item instanceof Role)

    if (value.length > 1 && role.length > 0) {
      this.#role = role.pop()
    }

    this.right = value[value.length - 1]

    if (this.right) {
      value.pop()
    }
    //
    // for (let item of value.reverse()) {
    //   if (item instanceof Group) {
    //     this.#group = item
    //     break
    //   }
    // }

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
   * @return {[type]} [description]
   */
  get display () {
    let stack = this.stack.slice()

    if (stack.length === 0) {
      return 'everyone (group)'
    }

    return stack.map((item, index, currentStack) => {
      if (item instanceof Role) {
        return `${item.name} (role)`
      }

      if (item instanceof Right && item.is(this.#permission)) {
        return `${item.name} (${item.denied ? 'right denied' : 'granted'}${item.name === '*' ? ' right to ' + this.#permission : ''})`
      }

      if (item instanceof Group) {
        return `${item.name} (${index > 0 ? 'sub' : ''}group)`
      }

      return `${item instanceof Right ? item.name : item} (right)`
    }).join(' --> ')
  }

  /**
   * @property {string}
   * Returns a description, similar to #display,
   * but in reverse order from right to source.
   */
  get description () {
    let stack = this.stack.slice()

    if (stack.length === 0 || (stack.length === 1 && stack[0] instanceof Role && stack[0].name === 'everyone')) {
      return `All users are ${this.allowed ? 'granted' : 'denied'} the "${this.#permission}" right on the "${this.#resource}" resource${stack.length > 0 ? ' by the "everyone" role' : ''}.`
    }

    if (stack.filter(item => item instanceof Right).length === 0) {
      console.error('No rights', this.#stack)
    }

    return (stack.reverse().map((item, index, currentStack) => {
      if (item instanceof Role) {
        return `the "${item.name}" role`
      }

      if (item instanceof Right) {
        return `The "${this.#permission}" right on the "${this.#resource}" resource is ${item.denied ? 'denied' : 'granted'}`
      }

      if (item instanceof Group) {
        return `${index < currentStack.length ? 'which is assigned to' : 'by'} the "${item.name}" group${index > 0 ? ', which is a member of' : ''}`
      }

      return `The "${item instanceof Right ? item.name : item}"`
    }).join(' by ')
    .replace(/by which/gi, ', which')
    .replace(/\s+\,/gi, ',')
    .replace(/(member of, which is assigned to)/gi, 'member of')
    + '.')
      .replace(/(is a member of\.)$/i, 'the user is a member of.')
  }

  get group () {
    if (this.#group) {
      return this.#group
    }

    if (this.#stack[0] instanceof Group) {
      this.#group = this.#stack[0]
      return this.#group
    }
  }

  set group (value) {
    if (value instanceof Group) {
      this.#group = value
    } else if (value instanceof String) {
      let grp = IAM.getGroup(value)

      if (grp) {
        this.#group = grp
      }
    }
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
      type: this.#stack[0] instanceof Group ? 'group' : 'role',
      resource: IAM.getResource(this.#resource),
      right: this.#permission,
      granted: this.#allowed,
      governedBy: {
        group: this.#group,
        role: this.#role,
        right: this.#right
      },
      stack: this.stack,
      display: this.display,
      description: this.description
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
