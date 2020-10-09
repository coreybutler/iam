import Registry from './lib/registry.js'
import Resource from './lib/actors/resource.js'
import Right from './lib/actors/right.js'
import Role from './lib/actors/role.js'
import User from './lib/actors/user.js'
import Group from './lib/actors/group.js'
import { REGISTRY_ID, VERSION } from './lib/utilities.js'

const everyone = Registry.createRole(Symbol.for('everyone'), {})
everyone.description = 'Rights for any user of the system.'

export {
  Registry as default,
  Registry as IAM,
  Resource,
  Right,
  Role,
  User,
  Group,
  REGISTRY_ID,
  VERSION
}
