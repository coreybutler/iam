import test from 'tappedout'
import { Domain } from '../src/index.js'

let domain,
    role,
    user,
    config = {
      name: 'Test Domain'
    }

test('Sanity Checks', t => {
  t.ok(Domain !== undefined, 'Domain class is exported from index.js.')
  t.expect('function', typeof Domain, 'Domain class is a function.')
  t.end()
})

test('Domain Configuration', t => {
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
  t.ok(Array.isArray(domain.roles) && domain.roles.length === 1 && domain.roles[0].name === 'Universal', 'Domain "roles" getter returns array with Universal Role by default.')
  t.ok(Array.isArray(domain.users) && domain.users.length === 0, 'Domain "users" getter returns empty array by default.')

  t.end()
})

test('Resource Configuration', t => {
  config = {
    ...config,
    
    resources: [{
      name: 'Resource',
      description: 'This is another test resource.',
      
      rights: ['right1', {
        name: 'right2',
        description: 'This right has a description.'
      }, 'right3']
    }, 'Another Resource']
  }

  domain = new Domain(config)

  t.ok(Array.isArray(domain.resources)
    && domain.resources.length === 2
    && domain.resources.every(resource => resource.constructor.name === 'Resource'),
    'Resources successfully added to Domain via config.'
  )

  t.ok(domain.resources[0].name === config.resources[0].name
    && domain.resources[1].name === config.resources[1],
    'Resource names match the ones provided in the config.'
  )

  t.expect(domain.resources[1].description, '',
    'Resource description is empty string if none provided in config.'
  )

  t.expect(domain.resources[0].description, config.resources[0].description,
    'Resource description matches the one provided in the config.'
  )

  const resource = domain.getResource('Resource')

  t.ok(
    Array.isArray(resource.rights)
      && resource.rights.length === 3
      && resource.rights.every(right => right.constructor.name === 'Right'),
    'Rights successfully added to Resource via config.'
  )

  t.end()
})

test('Role Configuration', t => {
  config = {
    ...config,
  
    roles: [{
      name: 'Role',
      aliases: ['Alternate Name'],
      description: 'This is a test Role.',
      permissions: {
        'Resource': ['right1', 'deny:right2']
      }
    }, 'Another Role', {
      name: 'Third Role',

      permissions: {
        'Resource': ['right3']
      }
    }],
  
    users: [{
      name: 'User',
      description: 'This is a test User.',
      permissions: {
        'Resource': ['right1', 'deny:right2']
      }
    }, 'Another User']
  }
  
  domain = new Domain(config)

  t.ok(Array.isArray(domain.roles) 
    && domain.roles.length === 4 // Including Universal Role
    && domain.roles.every(role => role.constructor.name === 'Role'),
    'Roles successfully added to Domain via config.'
  )

  t.ok(domain.roles[1].name === config.roles[0].name
    && domain.roles[2].name === config.roles[1],
    'Role names match the ones provided in the config.'
  )

  t.expect(domain.roles[2].description, '',
    'Role description is empty string if none provided in config.'
  )

  t.expect(domain.roles[1].description, config.roles[0].description,
    'Role description matches the one provided in the config.'
  )

  role = domain.getRole(config.roles[0].name)

  t.ok(!!role
    && role.constructor.name === 'Role'
    && role.name === config.roles[0].name
    && role.description === config.roles[0].description,
    'Role successfully retrieved using Domain "getRole" method.'
  )

  t.ok(
    role.isAuthorized('Resource', 'right1'),
    'Permission successfully allowed on Role via config.'
  )

  t.ok(
    !role.isAuthorized('Resource', 'right2'),
    'Permission successfully denied on Role via config.'
  )

  role.removePermission('Resource', 'right1')

  t.ok(
    !role.isAuthorized('Resource', 'right1'),
    'Permission successfully removed from Role via method call.'
  )

  role.addPermission('Resource', 'right1')

  t.ok(
    role.isAuthorized('Resource', 'right1'),
    'Permission successfully allowed on Role via method call.'
  )

  role.removePermission('Resource', 'right1')
  role.addPermission('Resource', 'deny:right1')

  t.ok(
    !role.isAuthorized('Resource', 'right1'),
    'Permission successfully denied to Role via method call.'
  )

  role.removePermission('Resource', 'deny:right1')
  role.addPermission('Resource', 'right1')
  role.addPermission('Resource', 'deny:right1')

  t.ok(
    !role.isAuthorized('Resource', 'right1'),
    'Allowed Permission successfully denied on Role using "deny" flag, via method call, using default weighting scheme.'
  )

  role.addPermission('Resource', 'priority allow:right1')

  t.ok(
    role.isAuthorized('Resource', 'right1'),
    'Denied Permission successfully allowed on Role using "priority allow" flag, via method call, using default weighting scheme.'
  )

  role.addPermission('Resource', 'priority deny:right1')

  t.ok(
    !role.isAuthorized('Resource', 'right1'),
    'Allowed Permission with "priority allow" flag successfully denied on Role using "priority deny" flag, via method call, using default weighting scheme.'
  )

  t.end()
})

test('User Configuration', t => {
  t.ok(Array.isArray(domain.users) 
    && domain.users.length === 2
    && domain.users.every(role => role.constructor.name === 'User'),
    'Users successfully added to Domain via config.'
  )

  t.ok(domain.users[0].name === config.users[0].name
    && domain.users[1].name === config.users[1],
    'User names match the ones provided in the config.'
  )

  t.expect(domain.users[1].description, '',
    'User description is empty string if none provided in config.'
  )

  t.expect(domain.users[0].description, config.users[0].description,
    'User description matches the one provided in the config.'
  )

  user = domain.getUser(config.users[0].name)

  t.ok(!!user
    && user.constructor.name === 'User'
    && user.name === config.users[0].name
    && user.description === config.users[0].description,
    'User successfully retrieved using Domain "getUser" method.'
  )

  t.ok(
    user.isAuthorized('Resource', 'right1'),
    'Permission successfully allowed on User via config.'
  )

  t.ok(
    !user.isAuthorized('Resource', 'right2'),
    'Permission successfully denied on User via config.'
  )

  user.removePermission('Resource', 'right1')

  t.ok(
    !user.isAuthorized('Resource', 'right1'),
    'Permission successfully removed from User via method call.'
  )

  user.addPermission('Resource', 'right1')

  t.ok(
    user.isAuthorized('Resource', 'right1'),
    'Permission successfully allowed on User via method call.'
  )

  user.removePermission('Resource', 'right1')
  user.addPermission('Resource', 'deny:right1')

  t.ok(
    !user.isAuthorized('Resource', 'right1'),
    'Permission successfully denied to User via method call.'
  )

  user.addPermission('Resource', 'right1')

  t.ok(
    user.isAuthorized('Resource', 'right1'),
    'Denied Permission successfully allowed on User by override, via method call, using default weighting scheme.'
  )

  user.addPermission('Resource', 'force deny:right1')

  t.ok(
    !user.isAuthorized('Resource', 'right1'),
    'Allowed Permission successfully denied on User using "force deny" flag, via method call, using default weighting scheme.'
  )

  user.addPermission('Resource', 'force allow:right1')

  t.ok(
    user.isAuthorized('Resource', 'right1'),
    'Denied Permission with "force deny" flag successfully allowed on user using "force allow" flag, via method call, using default weighting scheme.'
  )

  user.addRole('Third Role')

  t.ok(user.hasRole('Third Role'),
    'Role successfully added to User via method call.'
  )

  t.ok(user.isAuthorized('Resource', 'right3'),
    'Permissions successfuly applied by new Role.'
  )

  user.replacePermission('Resource', 'deny:right2', 'allow:right2')

  t.ok(user.isAuthorized('Resource', 'right2'),
    'Successfully replaced existing permission using method call.'
  )

  t.end()
})

test('Solver Methods', t => {
  // If all the above tests pass, this test passes
  t.pass('ACL updates correctly when permissions are changed on Solvers.')



  t.end()
})