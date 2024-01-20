import AuthorizationManagingEntity from './AuthorizationManagingEntity.js'

export default class Role extends AuthorizationManagingEntity {
  constructor (domain, parent, cfg) {
    super('Role', domain, parent, cfg, {
      'allow': 1,
      'important allow': 4,
      'very important allow': 8,
      'deny': 2,
      'important deny': 3,
      'very important deny': 7
    })
  }

  destroy = () => this.domain.removeRole(this.name)
}
