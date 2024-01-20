import AuthorizationManagingEntity from './AuthorizationManagingEntity.js'

export default class Role extends AuthorizationManagingEntity {
  constructor (domain, parent, cfg) {
    super('Role', domain, parent, cfg, {
      'allow': 1,
      'priority allow': 4,
      'high priority allow': 8,
      'deny': 2,
      'priority deny': 3,
      'high priority deny': 7
    })
  }

  destroy = () => this.domain.removeRole(this.name)
}
