import RightRelationshipManagingEntity from './RightRelationshipManagingEntity.js'

export default class User extends RightRelationshipManagingEntity {
  constructor (system, parent, cfg) {
    super('User', system, parent, cfg, {
      'allow': 6,
      'allow!!!': 9,
      'deny': 5,
      'deny!!!': 9
    })
  }
}