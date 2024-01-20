import Entity from './Entity.js'

export default class Group extends Entity {
  constructor (domain, parent, { name, description }) {
    super('Group', ...arguments)
  }

  destroy = (removeMembers = true) => this.domain.removeGroup(this.name, removeMembers)
}