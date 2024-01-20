import Group from './Group.js'
import Manager from './Manager.js'

export default class GroupManager extends Manager {
  constructor (domain, parent, groups) {
    super('Group', Group, ...arguments)
  }
}