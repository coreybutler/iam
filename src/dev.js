import { printJSON } from './utilities.js'
import Domain from './Domain.js'

const domain = new Domain({
  name: 'Author.io',
  description: 'This is a test domain.',

  // macros: [{

  // }],

  // mappings: {},

  resources: [{
    name: 'Licensing Screen',
    rights: ['read', 'write']
  // }, {
  //   name: 'Test Subresource',
    
  //   requires: {
  //     'Licensing Screen': ['read']
  //   },

  //   rights: ['view', 'manage']
  }, {
    name: 'Other Screen',
    rights: ['read', 'write']
  }],

  roles: [{
    name: 'Admin',

    permissions: {
      'Licensing Screen': ['priority allow:read']
    }
  }, {
    name: 'Basic User',
    roles: ['Admin'],

    permissions: {
      'Licensing Screen': ['deny:read'],
      'Other Screen': ['read', 'high priority deny:write']
    }
  }, {
    name: 'Basic User 2',
    roles: ['Basic User'],

    permissions: {
      'Licensing Screen': ['deny:read', 'write'],
      'Other Screen': ['read', 'priority allow:write']
    }
  }]

  // users: [{
  //   name: 'Graham',
  //   // roles: ['Admin'],
  //   permissions: {
  //     'Licensing Screen': ['write', 'read']
  //   }
  // }]
})

// printJSON(domain.toString())

// const resource = domain.getResource('Licensing Screen')
const role = domain.getRole('Basic User 2')

console.log(role.getACL('Licensing Screen').allowsAll)

// console.log(role.isAllowed('Licensing Screen', 'read'))

// console.log(role.hasAllPermissions('Licensing Screen'))

// const user = domain.getUser('Graham')

// console.log(user.hasAllPermissions('Licensing Screen'))

// 1. Has access to the resource?
// 2. Have one specific right on the resource?
// 3. Have one or more of a list of rights on the resource?
// 4. Have only one of a lost of rights on the resource?
// 5. Have n of a list of rights on the resource?
// 6. Have all of the specified rights on the resource?

// role.permits()
// role.permitsAny()
// role.permitsSome()
// role.permitsAll()
// role.permitsEach()

// role.hasPermission('Licensing Screen', 'write') // 2 arguments
// role.hasAnyPermission('Licensing Screen') // 1 arguments
// role.hasSomePermission('Licensing Screen', 'write', 'read') // 2 or more arguments
// role.hasAllPermissions('Licensing Screen') // 1 argument
// role.hasEachPermission('Licensing Screen', 'write', 'read') // 2 or more arguments

// domain.addMacro('Pretty Name', (obj, ...args) => {
//   return obj.hasAnyPermission('Resource 1') || obj.hasAnyPermission('Resource 2')
// })

// user.test('Pretty Name')

// on conflict

// role.hasEachPermission('Licensing Screen', 'write', 'read') // 1 or more arguments
// role.hasAnyPermission('Licensing Screen')
// role.hasEachPermission('Licensing Screen', 'write')

// role.hasPermission('Licensing Screen', {
//   each: ['write', 'read'],
//   any: ['manage', 'view']
// })

// role.hasPermission({ resource: 'Licensing Screen' })
// role.hasAllRights('Licensing Screen')

// role.hasPermission('Licensing Screen')



















// const resource = domain.addResource({ name: 'Licensing Screen', description: 'This is a test resource.', rights: ['write'] })

// console.log(resource)










// const domain = new Domain({
//   name: 'Test',
//   description: 'This is a test Domain.',

//   resources: [{
//     name: 'Licensing Screen',
//     description: 'This is a test Resource.',
//     rights: [{
//       name: 'read',
//       description: 'You can read stuff.'
//     }, {
//       name: 'write',
//       description: 'You can write stuff.'
//     }, 'manage', 'view']
//   }],

//   // roles: [{
//   //   name: 'Test Role',
//   //   description: 'This is a test Role.',
//   //   rights: {
//   //     'Licensing Screen': ['read']
//   //   }
//   // }],

//   // // groups: [{
//   // //   name: 'Test Group',
//   // //   description: 'This is a test Group.',
//   // //   roles: ['Test Role']
//   // // }],

//   // groups: [{
//   //   name: 'Superadmin',
//   //   roles: ['Admin Rights', 'Admin Rights 2']
//   // }],

//   roles: [{
//     name: 'Superadmin',
//     roles: ['Admin', 'Admin 2']
//   }, {
//     name: 'Admin',
//     rights: {
//       'Licensing Screen': ['read'],
//       'Licensing Screen 3': ['write']
//     }
//   }, {
//     name: 'Admin 2',
//     roles: ['Superadmin']
//     // rights: {
//     //   'Licensing Screen 3': ['deny:write']
//     // }
//   }, {
//     name: 'Plebeian',
//     rights: {
//       'Licensing Screen': ['read']
//     }
//   }],

//   users: [{
//     name: 'Graham Butler',
//     roles: ['Plebeian']
//   }, {
//     name: 'Corey Butler',
//     roles: ['Superadmin']
//   }],

//   // mappings: {
//   //   'Serf Rights': 'Ploebian Rights', // map to names or ids
//   //   'God': 'Superadmin'
//   // }
// })

// domain.getMapping('Superadmin').users

// function isAuthorized (domain, user) {
//   return domain.isAuthorized({
//     mappings: user.mappings,
//     roles: user.roles
//   })
// }




// import { Domain, isAuthorized } from 'iam'

// const domain = new Domain({...})

// const user = domain.addUser({
//   name: 'Graham Butler',
//   mappings: ['System 1 Company Owner', 'System 2 Company Owner'],
//   roles: ['Test Role']
// })

// user.isAuthorized('Resource', 'read')











// const resource = domain.getResource('Licensing Screen', 'read')
// // printJSON(domain.toString())

// // const user = domain.getUser('Graham Butler')
// // console.log(user.isAuthorized('Licensing Screen', 'read'));

// const role = domain.getRole('Test Role')

// // const right = role.getAuthorization('Licensing Screen', 'write')
// // console.log(right.toString())
// // console.log(role.isAuthorized('Licensing Screen'))

// console.log(resource.associatedUsers.map(({ name }) => name))

// const resource = domain.getResource('Licensing Screen')
// resource.addRight('hello')

// console.log(resource.associatedRoles)
// console.log(resource.associatedUsers)
// printJSON(domain.toString())

// const resource = domain.getResource('Licensing Screen')
// resource.removeRight('Hello')

// const role = domain.getRole('Test Role')

// console.log(role.isAuthorized('Licensing Screen', 'write'))
// role.unsetRight('Licensing Screen', 'read')

// const user = domain.findUsers({ name: 'Graham Butler' })[0]
// const user = domain.getUser('Graham Butler')
// console.log(user.isAuthorized('Licensing Screen', 'write'))

// domain.trust(peerdomain)

// domain.addResource({
//   name: 'Licensing Screen',
//   description: 'A Resource for testing.'
// })

// domain.addRole({
//   name: 'Test Role',
//   description: 'A Role for testing.',

//   rights: {
//     'Licensing Screen': 'read'
//   }
// })

// resources: [{
  //   name: 'Licensing Screen',
  //   description: 'This is a test Resource.',
  //   rights: [{
  //     name: 'read',
  //     description: 'You can read stuff.'
  //   }, 'write']
  // }, {
  //   name: 'Licensing Screen 2',
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
  //     'Licensing Screen': 'read'
  //   }
  // }],

  // users: [{
  //   name: 'Graham Butler',
  //   roles: ['Test Role'],
  //   rights: {
  //     'Licensing Screen': 'write'
  //   }
  // }]