import Manager from './Manager.js'
import User from './User.js'

export default class UserManager extends Manager {
  constructor (system, parent) {
    super('User', User, ...arguments)
  }
}