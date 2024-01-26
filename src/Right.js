import Entity from './Entity.js'

export default class Right extends Entity {
  constructor (config) {

    if (typeof config === 'string') {
      config = {
        name: config,
        description: ''
      }
    }

    super({ type: 'Right', ...config })
  }

  destroy = () => this.domain.removeRight(this.name)
}