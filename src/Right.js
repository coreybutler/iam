import Entity from './Entity.js'

export default class Right extends Entity {
  constructor (system, parent, { name, description }) {
    if (typeof arguments[0] === 'string') {
      name = arguments[0]
      description = ''
    }

    super('Right', system, parent, { name, description })
  }
}