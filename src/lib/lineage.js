import IAM from '../main.js'
import Group from './group.js'
import User from './user.js'
import Role from './role.js'

export default class Lineage {
  #type = 'role'
  #role = null
  #group = null
  #resource = null
  #right = null
  #allowed = false
  #forced = false
  #stack = []
  #display = []

  constructor (resource, right) {
    this.#resource = resource
    this.#right = right
    this.#stack.push(right instanceof Right ? right.name : right)
    this.#display.push(`${right instanceof Right ? right.name : right} (right)`)

    Object.defineProperties(this, {
      stack: {
        enumerable: false,
        get () {
          return this.#stack
        }
      },
      display: {
        enumerable: false,
        get () {
          return this.#display
        }
      }
    })
  }

  set role (value) {
    this.#role = value
    this.#stack.push(value)
    this.#display.push(`${value.name} (role)`)
  }

  set group (value) {
    this.#group = value
    this.#stack.push(value)
    this.#display.push(`${value.name} (group)`)
  }

  get data () {
    if (this.#stack.length === 0) {
      return null
    }

    return {
      type: this.#type,
      role: this.#role,
      group: this.#group,
      resource: this.#resource,
      right: this.#right,
      allowed: this.#allowed,
      lineage: this.#display.join(' --> '),
      stack: this.#stack.reverse()
    }
  }

  get forced () {
    return this.#forced
  }

  get allowed () {
    return this.#allowed
  }

  get denied () {
    return !this.#allowed
  }

  allow (force = false) {
    this.#allowed = true

    if (force) {
      this.#forced = true
    }
  }

  deny () {
    this.#allowed = false
  }

  trace (entity) {
    if (entity instanceof User) {
      // Get relevant roles directly assigned to the user
      for (let role of entity.roles) {
        let permissions = role.rights.get(this.#resource)

        if (permissions) {
          for (let permission of permissions) {
            if (permission.allowed) {
              this.allow(permission.forced)
            } else if (permission.denied) {
              this.deny()
            }

            if (permission.forced) {
              this.role = role
            } else if (permission.denied) {
              this.role = role
            } else if (permission.is(right) && !data.hasOwnProperty('role')) {
              this.role = role
            }
          }
        }
      }

      // Get roles assigned to the user via a group
      for (let group of entity.groups) {
        let lineage = group.trace(...arguments)

        if (lineage !== null && (!this.#role === null || lineage.forced || this.denied)) {
          this.#stack = lineage.stack
          this.#display = lineage.display
          this.#group = lineage.group
          this.#role = lineage.role

          if (lineage.allowed) {
            this.allow(lineage.forced)
          } else {
            this.deny()
          }
        }
      }
    } else if (entity instanceof Group) {
      this.#forced = false
      this.group = entity
    }
  }
}
