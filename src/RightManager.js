import Manager from './Manager.js'
import Right from './Right.js'

export default class RightManager extends Manager {
  constructor ({ domain, parent, rights }) {
    super({
      type: 'Right',
      domain,
      parent,
      items: rights,
      ItemConstructor: Right
    })
  }
}