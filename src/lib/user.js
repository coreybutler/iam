import IAM from '../main.js'

export default class User {
  constructor () {
    #roles = new Set(Array.from(arguments).map(name => name.trim().toUpperCase()))
  }

  inRole (role) {
    if (role.trim().toUpperCase() === 'EVERYONE') {
      return true
    }

    return this.#roles.has(role.trim().toUpperCase())
  }

  /**
   * Assign user a new role.
   * @param  {string} name
   * Name of the role.
   */
  grant (name) {
    this.#roles.add(name.trim().toUpperCase())
  }

  /**
   * Unassign user from new role.
   * @param  {string} name
   * Name of the role.
   */
  deny (name) {
    if (name.trim().toUpperCase() === 'EVERYONE') {
      throw new Error('Cannot deny the "${name}" role for users.')
    }

    this.#roles.delete(name.trim().toUpperCase())
  }

  /**
   * Clear the user of all roles (except the `everyone` role)
   * @return {[type]} [description]
   */
  clear () {
    this.#roles = new Set('EVERYONE')
  }

  /**
   * Determines whether the user is granted access to the
   * specified resource feature.
   * @param  {String} resource
   * Name of the resource.
   * @param  {String} [feature='*']
   * Name of the feature to check for permissions. By default,
   * this method will check for all features. It will return `false`
   * if the user doesn't have permissions to all of the specified features.
   * It is typically best to specify a single particular feature.
   * @return {boolean}
   */
  granted (resource = '', feature = '*') {
    console.log(IAM.getResourcePermissions(resource))
    // if (feature === '*') {
    //   IAM.getResourcePermissions(resource).forEach()
    // }
    //
    // return IAM.isAuthorized(this, ...arguments)
  }
}
