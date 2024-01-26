import Group from './Group.js'
import Manager from '../src/Manager.js'

export default class GroupManager extends Manager {
  constructor ({ domain, parent = null, groups }) {
    super({
      type: 'Group',
      domain,
      items: groups
    })
  }

  add (config) {
    return super.add(new Group({ domain: this.domain, parent: this, ...config }))
  }

  find ({ name, resource }) {
    return super.find(group => group.name.includes(name) || group.isAuthorized(resource))
  }
}