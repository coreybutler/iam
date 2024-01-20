import Entity from './Entity.js'

export default class Group extends Entity {
  constructor (domain, parent, { name, description }) {
    super('Group', ...arguments)
  }

  destroy = () => this.domain.removeGroup(this.name)
}