import { ROLE_WEIGHTS } from './Constants.js'
import Solver from './Solver.js'

export default class Role extends Solver {
  constructor (config) {
    super({
      type: 'Role',
      ...config,
      weights: ROLE_WEIGHTS
    })
  }
}
