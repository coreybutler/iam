import Manager from './Manager.js'
import Mapping from './Mapping.js'

export default class MappingManager extends Manager {
  constructor ({ domain, mappings }) {
    super({
      type: 'Mapping',
      namespace: 'mapping',
      domain,
      items: mappings,
      ItemConstructor: Mapping
    })
  }
}