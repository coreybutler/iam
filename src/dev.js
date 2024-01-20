import { printJSON } from './utilities.js'
import Domain from './Domain.js'

const domain = new Domain({
  name: 'Test',
  description: 'This is a test Domain.',

  resources: [{
    name: 'Test Resource',
    description: 'This is a test Resource.',
    rights: [{
      name: 'read',
      description: 'You can read stuff.'
    }, 'write']
  }],

  // groups: [{
  //   name: 'Test Group',
  //   description: 'This is a test Group.',
  //   roles: []
  // }],

  roles: [{
    name: 'Test Role',
    description: 'This is a test Role.',
    rights: {
      'Test Resource': 'write'
    }
  }],

  users: [{
    name: 'Graham Butler',
    roles: ['Test Role'],
    // rights: {
    //   'Test Resource': 'write'
    // }
  }]
})

// printJSON(domain.toString())

// const resource = domain.getResource('Test Resource')
// resource.addRight('hello')

// console.log(resource.associatedRoles)
// console.log(resource.associatedUsers)
// printJSON(domain.toString())

// const resource = domain.getResource('Test Resource')
// resource.removeRight('Hello')

// const role = domain.getRole('Test Role')

// console.log(role.isAuthorized('Test Resource', 'write'))
// role.unsetRight('Test Resource', 'read')

// const user = domain.findUsers({ name: 'Graham Butler' })[0]
const user = domain.getUser('Graham Butler')
console.log(user.isAuthorized('Test Resource', 'write'))

// domain.trust(peerdomain)

// domain.addResource({
//   name: 'Test Resource',
//   description: 'A Resource for testing.'
// })

// domain.addRole({
//   name: 'Test Role',
//   description: 'A Role for testing.',

//   rights: {
//     'Test Resource': 'read'
//   }
// })

// resources: [{
  //   name: 'Test Resource',
  //   description: 'This is a test Resource.',
  //   rights: [{
  //     name: 'read',
  //     description: 'You can read stuff.'
  //   }, 'write']
  // }, {
  //   name: 'Test Resource 2',
  //   description: 'This is another test Resource.',
  //   rights: [{
  //     name: 'view',
  //     description: 'You can view this resource.'
  //   }, 'manage']
  // }],

  // groups: [{
  //   name: 'Test Group',
  //   description: 'This is a test Group.',
  //   roles: []
  // }],

  // roles: [{
  //   name: 'Test Role',
  //   description: 'This is a test Role.',
  //   rights: {
  //     'Test Resource': 'read'
  //   }
  // }],

  // users: [{
  //   name: 'Graham Butler',
  //   roles: ['Test Role'],
  //   rights: {
  //     'Test Resource': 'write'
  //   }
  // }]