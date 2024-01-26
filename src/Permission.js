import Component from './Component.js'
import { list, throwError } from './utilities.js'

export default class Permission extends Component {
  #resource
  #right
  #target
  #type

  constructor ({ domain, parent, target, resource, spec }) {
    super({ type: 'Permission', domain, parent })

    const [type, right] = (spec.includes(':') ? spec : `allow:${spec}`).split(':').map(chunk => {
      chunk = chunk.trim()
      return chunk === 'all' ? '*' : chunk
    })

    if (!parent.weights.hasOwnProperty(type)) {
      return throwError(domain, `"${resource}" Resource: "${target.name}" ${target.type}: Invalid permission "${spec}". Options include ${list(...Object.keys(parent.weights))}.`)
    }

    this.#resource = resource
    this.#right = right
    this.#target = target
    this.#type = type
  }

  get allows () {
    return this.#type.includes('allow') ?? false
  }

  get resource () {
    return this.#resource
  }

  get right () {
    return this.#right
  }

  get target () {
    return this.#target
  }

  get type () {
    return this.#type
  }

  get weight () {
    return this.parent.weights[this.#type] ?? 0
  }

  toString () {
    return `${this.#type}:${this.#right}`
  }
}