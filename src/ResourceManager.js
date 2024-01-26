import Manager from './Manager.js'
import Resource from './Resource.js'

export default class ResourceManager extends Manager {
  constructor ({ domain, resources }) {
    super({
      type: 'Resource',
      namespace: 'resource',
      domain,
      ItemConstructor: Resource,
      items: resources
    })
  }
}