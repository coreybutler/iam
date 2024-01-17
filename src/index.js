import System from './System.js'

const system = new System({
  name: 'Test',
  description: 'This is a test System.',

  // resources: [{
  //   name: 'Test Resource',
  //   description: 'This is a test Resource.',
  //   rights: [{
  //     name: 'read',
  //     description: 'You can read stuff. FAT'
  //   }, 'write']
  // }, {
  //   name: 'Test Resource 2',
  //   description: 'This is a test Resource.',
  //   rights: [{
  //     name: 'read',
  //     description: 'You can read stuff. FAT'
  //   }, 'write']
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
})

system.addResource({
  name: 'Test Resource',
  description: 'A Resource for testing.'
})

console.log(system.toString())

// const resource = system.getResource('Test Resource')
// resource.removeRight('Hello')

// const role = system.getRole('Test Role')
// role.unsetRight('Test Resource', 'read')