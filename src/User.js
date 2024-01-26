import Profile from './Profile.js'

export default class User extends Profile {
  constructor (config) {
    super({
      ...config,
      type: 'User',

      weights: {
        'deny': 5,
        'allow': 6,
        'always allow': 10,
        'always deny': 9
      }
    })
  }
}