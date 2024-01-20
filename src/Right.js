import Entity from './Entity.js'

export default class Right extends Entity {
  constructor (domain, parent, cfg) {

    if (typeof cfg === 'string') {
      cfg = {
        name: cfg,
        description: ''
      }
    }

    super('Right', domain, parent, cfg)
  }

  destroy = () => this.domain.removeRight(this.name)
}