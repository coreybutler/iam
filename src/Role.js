import { ROLE_WEIGHTS } from './Constants.js'
import Solver from './Solver.js'

export default class Role extends Solver {
  #isUniversal

  constructor (config, isUniversal = false) {
    super({
      type: 'Role',
      ...config,
      weights: ROLE_WEIGHTS
    })

    this.#isUniversal = isUniversal
  }

  get isUniversal () {
    return this.#isUniversal
  }
}
