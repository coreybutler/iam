import test from 'tappedout'
import { Domain } from '../src/index.js'

let domain

test('Sanity Checks', t => {
  t.ok(Domain !== undefined, 'Domain class is exported from index.js.')
  t.expect('function', typeof Domain, 'Domain class is a function.')
  t.end()
})

test('Domain Configuration', t => {
  let config = {
    name: 'Test Domain'
  }

  try {
    domain = new Domain
  } catch (error) {
    domain = new Domain(config)
    t.ok(true, 'Domain constructor errors if "name" property is not present.')
  }

  t.expect(typeof domain.oid, 'symbol', 'Domain OID exists and is the correct type.')
  t.expect(config.name, domain.name, 'Domain name matches the supplied value.')
  t.expect('Domain', domain.type, 'Domain has the correct "type" value.')
  t.expect('', domain.description, 'Domain has default description.')

  config = {
    ...config,
    description: 'This is a test domain.'
  }
  
  domain = new Domain(config)

  t.expect(config.description, domain.description, 'Domain description matches the supplied value.')
  t.ok(Array.isArray(domain.mappings) && domain.mappings.length === 0, 'Domain "mappings" getter returns empty array by default.')
  t.ok(Array.isArray(domain.resources) && domain.resources.length === 0, 'Domain "resources" getter returns empty array by default.')
  t.ok(Array.isArray(domain.roles) && domain.roles.length === 0, 'Domain "roles" getter returns empty array by default.')
  t.ok(Array.isArray(domain.users) && domain.users.length === 0, 'Domain "users" getter returns empty array by default.')

  config = {
    ...config,
    
    resources: ['Test Resource', {
      name: 'Test Resource 2',
      description: 'This is another test resource.',
      rights: ['read', {
        name: 'write',
        description: 'Allows writing.'
      }]
    }],

    roles: ['Test Role', {
      name: 'Test Role 2',
      alternateNames: ['Some Other Name'],
      description: 'This is another test role.',
      permissions: {
        'Test Resource 2': ['read', 'deny:write']
      }
    }],

    users: ['Test User', {
      name: 'Test User 2',
      description: 'This is another test user.',
      permissions: {
        'Test Resource 2': ['read', 'deny:write']
      }
    }]
  }

  domain = new Domain(config)

  t.ok(
    Array.isArray(domain.resources)
      && domain.resources.length === 2
      && domain.resources[0].constructor.name === 'Resource'
      && domain.resources[1].constructor.name === 'Resource'
      && domain.resources[0].name === config.resources[0]
      && domain.resources[0].description === ''
      && domain.resources[1].name === config.resources[1].name
      && domain.resources[1].description === config.resources[1].description,
    'Resources successfully added to Domain via config.'
  )

  t.ok(
    Array.isArray(domain.roles)
      && domain.roles.length === 2
      && domain.roles[0].constructor.name === 'Role'
      && domain.roles[1].constructor.name === 'Role'
      && domain.roles[0].name === config.roles[0]
      && domain.roles[0].description === ''
      && domain.roles[1].name === config.roles[1].name
      && domain.roles[1].description === config.roles[1].description,
    'Roles successfully added to Domain via config.'
  )

  t.ok(
    Array.isArray(domain.users)
      && domain.users.length === 2
      && domain.users[0].constructor.name === 'User'
      && domain.users[1].constructor.name === 'User'
      && domain.users[0].name === config.users[0]
      && domain.users[0].description === ''
      && domain.users[1].name === config.users[1].name
      && domain.users[1].description === config.users[1].description,
    'Users successfully added to Domain via config.'
  )

  const resource = domain.getResource('Test Resource 2')

  t.ok(
    Array.isArray(resource.rights)
      && resource.rights.length === 2
      && resource.rights[0].constructor.name === 'Right'
      && resource.rights[1].constructor.name === 'Right'
      && resource.rights[0].name === config.resources[1].rights[0]
      && resource.rights[0].description === ''
      && resource.rights[1].name === config.resources[1].rights[1].name
      && resource.rights[1].description === config.resources[1].rights[1].description,
    'Rights successfully added to Resource via config.'
  )

  // t.ok(
  //   Array.isArray(resource.roles),
  //     // && resource.rights.length === 2
  //     // && resource.rights[0].constructor.name === 'Right'
  //     // && resource.rights[1].constructor.name === 'Right'
  //     // && resource.rights[0].name === config.resources[1].rights[0]
  //     // && resource.rights[0].description === ''
  //     // && resource.rights[1].name === config.resources[1].rights[1].name
  //     // && resource.rights[1].description === config.resources[1].rights[1].description,
  //   'Roles successfully added to Resource via config.'
  // )

  // const role = domain.getRole('Test Role 2')

  // // t.ok(
  // //   Array.isArray(resource.rights)
  // //     && resource.rights.length === 2
  // //     && resource.rights[0].constructor.name === 'Right'
  // //     && resource.rights[1].constructor.name === 'Right'
  // //     && resource.rights[0].name === config.resources[1].rights[0]
  // //     && resource.rights[0].description === ''
  // //     && resource.rights[1].name === config.resources[1].rights[1].name
  // //     && resource.rights[1].description === config.resources[1].rights[1].description,
  // //   'Rights successfully added to Resource via config.'
  // // )
  // console.log(role.permissions)

  t.end()
})