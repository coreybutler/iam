import Component from './Component.js'

export default class Authorization extends Component {
  #type
  #resource
  #right
  #weights

  constructor (domain, parent, resource, spec, weights) {
    super('Authorization', domain, parent)
    
    const [type, right] = spec.includes(':') ? spec.split(':') : ['allow', spec]

    this.#resource = resource
    this.#type = type
    this.#right = right
    this.#weights = weights
  }

  get resource () {
    return this.#resource
  }

  get right () {
    return this.#right
  }

  get type () {
    return this.#type
  }

  get weight () {
    return this.#weights.get(this.#type)
  }
}