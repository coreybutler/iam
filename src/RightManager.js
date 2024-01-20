import Manager from './Manager.js'
import Right from './Right.js'

export default class RightManager extends Manager {
  constructor (domain, parent, rights) {
    super('Right', Right, ...arguments)
  }

  add = cfg => super.add(typeof cfg === 'string' ? { name: cfg } : cfg)
}