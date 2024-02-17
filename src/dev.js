import { printJSON } from './utilities.js'
import Domain from './Domain.js'

const domain = new Domain({
  name: 'Author.io',
  description: 'This is a test domain.',

  resources: [{
    name: 'Licensing Screen',
    rights: ['read', 'write'],
  }, {
    name: 'Other Screen',
    rights: ['read', 'write']
  }],

  // universalRole: {
  //   name: 'Universal',
  //   // roles: [],
  //   permissions: {
  //     'Licensing Screen': ['read']
  //   }
  // },

  roles: [{
    name: 'Admin',

    permissions: {
      'Licensing Screen': ['read']
    }
  }, {
    name: 'Basic User',
    roles: ['Admin'],

    permissions: {
      'Licensing Screen': ['read']
    }
  }, {
    name: 'Basic User 2',
    roles: ['Basic User'],

    // permissions: {
    //   'Licensing Screen': ['read']
    // }
  }, {
    name: 'Basic User 3',
    roles: ['Basic User 2'],

    metadata: {

    }
  }, {
    name: 'Basic User 4',
    roles: ['Basic User 3']
  }],

  users: [{
    name: 'Graham',
    roles: ['Basic User 4'],

    ttl: 4000,
    
    // permissions: {
    //   'Licensing Screen': ['read']
    // },

    metadata: {
      dob: ''
    }
  }]
})

const user = domain.getUser('Graham'),
      acl = user.getACL('Licensing Screen'),
      lineage = acl.getLineage('read')

// let renewed = false

// user.on('ttl.expire', ({ renew }) => {
//   if (!renewed) {
//     renewed = true
//     renew()
//   }
// })

console.log(lineage?.description)
// lineage.forEach(e => console.log(e.data))

// printJSON(domain.toString())
// const role = domain.getRole('Admin')

// console.log(role.getPermissions('Licensing Screen', 'deny:write'));
// console.log(role.isAuthorized('Licensing Screen', 'write'))


// Parity:
// All Users Role
// Events
// Trace/Lineage

// Then:
// Macros
// Trusts
// Resource Requirements

// const ghDomain = new Domain({
//   name: 'Github',

//   roles: [{
//     name: 'Administrator',
//     permissions: {}
//   }],

//   users: [{
//     name: 'Github Guy'
//   }]
// })


// printJSON(domain.toString())

// const role = domain.getRole('Universal')
// const user = domain.getUser('Graham'),
// const user = domain.getUser('Graham'),
//       lineage = user.getLineage('Licensing Screen', 'read')

// // lineage.reverse()
// console.log(lineage.description);
// printJSON(JSON.stringify(lineage))
// console.log(user.getPermission('Licensing Screen', 'read'))

// console.log(user.getLineage('Licensing Screen', 'read'))

// role.removeRole('All Users')
// user.removeRole('Basic User')


// const administrator = ghDomain.getRole('Administrator'),
//       adminACL = administrator.requestACL(aioDomain, 'Licensing Screen')

// const user = ghDomain.getUser('Github Guy'),
//       userACL = user.requestACL(aioDomain, 'Licensing Screen')


// printJSON(domain.toString())

// const user = domain.getUser('Graham'),
//       acl = user.getACL('Licensing Screen')

// console.log(acl.allows('read'))

// const guy = githubDomain.getUser('Guy')

// guy.haveAccessTo(domain, 'Licensing Screen', 'read')



// user.setPermission('Licensing Screen', 'always deny:read') // This should EDIT the existing permission, not add a new one, add new/old

// console.log(acl.allows('read'))

// user.setPermission('Licensing Screen', 'always allow:read')

// console.log(acl.allows('read'))

// BULK OPERATION ID - for bulk operations, create an id which can be referenced by each individual operation so that events are only fired
// once the bulk operation completes. It would be a way of grouping actions together and firing events predictably. You could also
// ignore individual operation events in handler if they match the id of currently executing bulk operation.

// domain.addMacro('Pretty Name', (obj, ...args) => {
//   return obj.hasAnyPermission('Resource 1') || obj.hasAnyPermission('Resource 2')
// })

// user.test('Pretty Name')

// on conflict