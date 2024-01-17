import RightRelationshipManagingEntity from './RightRelationshipManagingEntity.js'

export default class Role extends RightRelationshipManagingEntity {
  #rights
  
  constructor (system, parent, cfg) {
    super('Role', system, parent, cfg, {
      'allow': 1,
      'allow!': 4,
      'allow!!': 8,
      'deny': 2,
      'deny!': 3,
      'deny!!': 7
    })
  }
}