import Group from './Group.js'
import Manager from './Manager.js'

export default class GroupManager extends Manager {
  constructor (system, parent) {
    super('Group', Group, ...arguments)
  }
}