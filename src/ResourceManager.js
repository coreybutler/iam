import Manager from './Manager.js'
import Resource from './Resource.js'

export default class ResourceManager extends Manager {
  constructor (domain, parent, resources) {
    super('Resource', Resource, ...arguments)
  }
}