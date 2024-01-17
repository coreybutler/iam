import Manager from './Manager.js'
import Right from './Right.js'

export default class RightManager extends Manager {
  constructor (system, parent) {
    super('Right', Right, ...arguments)
  }
}