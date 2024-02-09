import { USER_WEIGHTS } from './Constants.js'
import Solver from './Solver.js'
import { throwError } from './utilities.js'

export default class User extends Solver {
  constructor (config) {
    super({
      ...config,
      type: 'User',
      weights: USER_WEIGHTS
    })

    this.assignRole(this.domain.universalRole.name, true)
  }

  unassignRole (name) {
    name === this.domain.universalRole.name
      ? throwError(this.domain, `Cannot unassign "${name}" role from user "${this.name}". This is a reserved role assigned to all users automatically.`)
      : super.unassignRole(name)
  }
}