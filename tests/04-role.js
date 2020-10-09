import test from 'tappedout'
import IAM, { REGISTRY_ID, Role } from '@author.io/iam'

test('Basic Role', t => {
  IAM.createResource('blog', ['create', 'read', 'update', 'delete'])
  IAM.createResource('users', ['create', 'read', 'update', 'delete'])
  IAM.createResource('other', ['create', 'read', 'update', 'delete'])

  const role = new Role('admin', {
    blog: 'allow:*',
    users: 'allow:*'
  })

  t.expect('admin', role.name, 'Named role.')
  t.ok(role.appliesToResource('blog'), 'Indicate when a role governs a resource.')
  t.ok(!role.appliesToResource('other'), 'Indicate when a role does not govern a resource.')

  const roles = new Set(role.resourceList)
  t.expect(true, roles.has('blog'), 'Role recognized.')
  t.expect(true, roles.has('users'), 'Another (different) role recognized.')

  t.expect(true, role.authorized('blog', 'create'), 'Authorize permission by role.')
  t.expect(false, role.authorized('other', 'create'), 'Deny permission by role.')

  const { data } = role
  t.expect('admin', data.name, 'Output role name.')
  t.expect('', data.description, 'Output role description.')
  t.expect('*', data.rights.blog[0].name, 'Recognized first permission/right.')
  t.expect('allow:all', data.rights.users[0].right, 'Recognized second permission/right.')

  t.expect(2, IAM.roles.length, 'Registry recognizes role.')

  IAM.removeRole('admin')
  t.expect(1, IAM.roles.length, 'Role deleted successfully')

  t.end()
})

test('Create via Registry', t => {
  const role = IAM.createRole('admin', {
    blog: 'allow:*',
    users: 'allow:*'
  })

  t.expect('admin', role.name, 'Named role.')
  t.ok(role.appliesToResource('blog'), 'Indicate when a role governs a resource.')
  t.ok(!role.appliesToResource('other'), 'Indicate when a role does not govern a resource.')

  const roles = new Set(role.resourceList)
  t.expect(true, roles.has('blog'), 'Role recognized.')
  t.expect(true, roles.has('users'), 'Another (different) role recognized.')

  t.expect(true, role.authorized('blog', 'create'), 'Authorize permission by role.')
  t.expect(false, role.authorized('other', 'create'), 'Deny permission by role.')

  const { data } = role
  t.expect('admin', data.name, 'Output role name.')
  t.expect('', data.description, 'Output role description.')
  t.expect('*', data.rights.blog[0].name, 'Recognized first permission/right.')
  t.expect('allow:all', data.rights.users[0].right, 'Recognized second permission/right.')

  t.expect('admin', IAM.role('admin').name, 'Registry retrieves role by name.')
  t.expect(2, IAM.roles.length, 'Registry recognizes role.')

  IAM.removeRole()
  t.expect(1, IAM.roles.length, 'Role deleted successfully')

  t.end()
})

test('Internal/Hard Coded Roles', t => {
  IAM.removeRole('everyone')
  t.expect(1, IAM.roles.length, 'Disallow removal of "everyone" role.')

  t.throws(() => IAM.createRole('everyone', {}), 'Disallow creation/overwrite of "everyone" role.')

  IAM.createResource('simple', ['create', 'read', 'update', 'delete'])

  IAM.everyone({
    simple: ['deny:create', 'read'],
    other: 'read'
  })

  const role = IAM.role('everyone')
  t.expect(2, role.resources.length, 'Identify resources assigned to everyone.')

  const { rights } = role

  const countRights = Array.from(Object.keys(rights)).reduce((sum, resource) => {
    sum += rights[resource].length
    return sum
  }, 0)

  t.expect(3, countRights, 'Identify rights permitted to everyone.')

  t.ok(role.authorized('simple', 'read'), 'Recognized basic right.')
  t.expect(false, role.authorized('simple', 'create'), 'Deny forcibly rejected right.')
  t.expect(false, role.authorized('simple', 'update'), 'Deny unassigned right.')
  t.expect(false, role.authorized('other', 'update'), 'Deny right when it is not a part of the role.')

  t.end()
})
