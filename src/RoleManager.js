import Manager from './Manager.js'
import Role from './Role.js'

export default class RoleManager extends Manager {
  constructor (system, parent) {
    super('Role', Role, ...arguments)
  }
}