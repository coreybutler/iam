import { USER_WEIGHTS } from './Constants.js'
import Solver from './Solver.js'

export default class User extends Solver {
  constructor (config) {
    super({
      ...config,
      type: 'User',
      weights: USER_WEIGHTS
    })
  }
}