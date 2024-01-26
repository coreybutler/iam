import Profile from './Profile.js'

export default class Role extends Profile {
  constructor (config) {
    super({
      type: 'Role',
      ...config,
      weights: {
        'allow': 1,
        'priority allow': 4,
        'high priority allow': 8,
        'deny': 2,
        'priority deny': 3,
        'high priority deny': 7
      }
    })
  }
}
