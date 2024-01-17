import Entity from './Entity.js'

export default class Group extends Entity {
  constructor (system, parent, { name, description }) {
    super('Group', ...arguments)
  }
}