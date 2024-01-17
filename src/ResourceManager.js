import Manager from './Manager.js'
import Resource from './Resource.js'

export default class ResourceManager extends Manager {
  constructor (system, parent) {
    super('Resource', Resource, ...arguments)
  }
}