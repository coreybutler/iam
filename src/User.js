import AuthorizationManagingEntity from './AuthorizationManagingEntity.js'

export default class User extends AuthorizationManagingEntity {
  #groups = []
  #roles = []

  constructor (domain, parent, cfg) {
    super('User', domain, parent, cfg, {
      'deny': 5,
      'allow': 6,
      'always allow': 9,
      'always deny': 9
    })

    for (let role of cfg.roles ?? []) {
      this.#roles.push(role)
    }
  }

  destroy = () => this.domain.removeUser(this.name)

  assignGroup (group) {
    console.log('JOIN GROUP', group)
  }

  assignRole (role) {
    console.log('ASSIGN ROLE', role)
  }

  isAuthorized (resource, right) {
    return super.isAuthorized(...arguments)
      || this.#roles.some(role => this.domain.getRole(role)?.isAuthorized(...arguments))
      || this.#groups.some(group => this.domain.getGroup(group)?.isAuthorized(...arguments))
  }

  isInGroup (group) {
    console.log(this)
  }

  isInRole (role) {
    console.log(this)
  }

  unassignGroup (group) {
    console.log('LEAVE GROUP', group)
  }

  unassignRole (role) {
    console.log('UNASSIGN ROLE', role)
  }
}