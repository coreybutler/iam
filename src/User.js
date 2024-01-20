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
  }

  destroy = () => this.domain.removeUser(this.name)

  assignRole (role) {
    console.log('ASSIGN ROLE', role)
  }

  isAuthorized (resource, right) {
    return super.isAuthorized(...arguments) || this.#roles.some(role => role.isAuthorized(...arguments))
  }

  isInGroup (group) {
    console.log(this)
  }

  isInRole (role) {
    console.log(this)
  }

  joinGroup (group) {
    console.log('JOIN GROUP', group)
  }

  leaveGroup (group) {
    console.log('LEAVE GROUP', group)
  }

  unassignRole (role) {
    console.log('UNASSIGN ROLE', role)
  }
}