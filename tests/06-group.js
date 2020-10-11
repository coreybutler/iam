import test from 'tappedout'
import IAM, { User, Group } from '@author.io/iam'

test('Basic Group Roles', t => {
  IAM.createResource({
    blog: IAM.CRUD,
    users: IAM.CRUD,
    portal: IAM.CRUD
  })

  IAM.createRole('admin', {
    blog: 'allow:*',
    users: 'allow:*'
  })

  const group = new Group('administrator')

  group.assign('admin')
  t.expect(1, group.roles.length, 'Group assignment recognized.')

  group.revoke('admin')
  t.expect(0, group.roles.length, 'Group honors role revocation.')

  t.end()
})

test('Subgroups', t => {
  const basic = new Group('basic')
  const admin = IAM.group('administrator')

  admin.add(basic)
  t.expect(1, admin.memberCount, 'Subgroup recognized.')
  t.expect(1, admin.groupCount, 'Group counted.')
  t.expect(0, admin.userCount, 'Users counted.')
  t.expect(1, basic.parentCount, 'Parent recognized.')

  const { subgroups } = admin
  t.expect(basic, subgroups[0], 'Subgroup retrieved from parent.')

  admin.add('basic')
  t.expect(1, admin.memberCount, 'Adding the same group multiple times does not duplicate membership.')

  admin.remove('basic')
  t.expect(0, admin.memberCount, 'Remove subgroup.')
  t.expect(0, basic.parentCount, 'Remove parent association.')

  t.end()
})

test('Membership', t => {
  const base = new Group('base')
  const owner = new Group('owner')
  const user = new User()

  user.name = 'Demo User'

  user.join(base)
  t.expect(1, user.groups.length, 'User joins group.')
  t.ok(user.memberOf('base'), 'User recognizes membership in group.')

  owner.add(base, user)
  t.expect(1, owner.userCount, 'Users counted.')
  t.expect(1, owner.groupCount, 'Groups counted.')
  t.expect(2, owner.memberCount, 'All members counted.')

  user.leave('base', 'owner')
  t.expect(0, user.groups.length, 'User leaves group.')

  t.end()
})

test('Inherited Permissions', t => {
  IAM.removeResource()
  IAM.createResource('public', IAM.CRUD)
  IAM.createResource('adminportal', IAM.CRUD)
  IAM.everyone({
    public: '*',
    adminportal: 'deny:*'
  })

  IAM.createRole('administrator_role', {
    adminportal: ['allow:read', 'allow:update']
  })

  IAM.createRole('god_role', {
    adminportal: 'allow:*'
  })

  const superuser = IAM.createGroup('superuser')
  const admin = IAM.createGroup('superadmin')
  const god = IAM.createGroup('god')

  // Assign admin role to admin group
  admin.assign('administrator_role')

  // Add admin group to god group
  god.add(admin)

  // Assign god role to god group
  god.assign('god_role')
  t.ok(IAM.currentUser.authorized('public', 'read'), 'Basic allowed rights applied.')
  t.ok(!IAM.currentUser.authorized('adminportal', 'read'), 'Basic denied rights applied.')

  // Assign admin rights to user
  admin.add(IAM.currentUser)
  t.ok(IAM.currentUser.authorized('adminportal', 'read'), 'Higher level rights applied.')
  t.ok(!IAM.currentUser.authorized('adminportal', 'create'), 'Higher level denied rights applied.')

  // Upgrade user group membership
  IAM.currentUser.leave(admin)
  IAM.currentUser.join(god)
  t.ok(IAM.currentUser.authorized('adminportal', 'read'), 'Highest level rights applied.')
  t.ok(IAM.currentUser.authorized('adminportal', 'create'), 'Overridden rights applied.')
  t.end()
})

test('Group Lineage', t => {
  const lineage = IAM.group('god').trace('adminportal', 'create')
  const { data, display, description, granted, denied, forced } = lineage

  t.expect('group', data.type, 'Recognizes lineage originates from group membership.')
  t.expect('adminportal', data.resource, 'Lineage identifies resource.')
  t.expect('create', data.right, 'Recognized right.')
  t.ok(data.granted, 'Recognizes permission.')
  t.expect('god', data.governedBy.group, 'Recognize origin group.')
  t.expect('god_role', data.governedBy.role, 'Recognize role.')
  t.expect('right', data.governedBy.right.type, 'Recognize the permission.')
  t.expect(3, data.stack.length, 'Recognizes full lineage stack.')
  t.expect('god (group) --> god_role (role) --> * (granted create)', data.display, 'Describe lineage (data).')
  t.expect('god (group) --> god_role (role) --> * (granted create)', display, 'Describe lineage (attribute).')
  t.expect(`The "create" right of the "adminportal" resource is granted by the "god_role" role, which is inherited from the "god" group, which the user is a member of.`, description, 'Verbose description.')
  t.ok(granted, 'Granted attribute reflects permission.')
  t.ok(!denied, 'Denied attribute reflects permission.')
  t.ok(forced, 'Forced permission recognized.')

  t.end()
})

test('Group Member Lineage', t => {
  const lineage = IAM.currentUser.trace('adminportal', 'create')
  const { data, display, description, granted, denied, forced } = lineage

  t.expect('user', data.type, 'Recognize lineage originates from user.')
  t.expect('create', data.right, 'Recognized right.')
  t.ok(data.granted, 'Recognizes permission.')
  t.expect(null, data.governedBy.group, 'Recognize origin is not a group.')
  t.expect('god_role', data.governedBy.role, 'Recognize role.')
  t.expect('right', data.governedBy.right.type, 'Recognize the permission.')
  t.expect(4, data.stack.length, 'Recognizes full lineage stack.')
  t.expect('Demo User (user) --> god (group) --> god_role (role) --> * (granted create)', data.display, 'Describe lineage (data).')
  t.expect('Demo User (user) --> god (group) --> god_role (role) --> * (granted create)', display, 'Describe lineage (attribute).')
  t.expect(`The "create" right of the "adminportal" resource is granted by the "god_role" role, which is inherited from the "god" group, which the user is a member of.`, description, 'Lineage description is relative to user.')
  t.ok(granted, 'Granted attribute reflects permission.')
  t.ok(!denied, 'Denied attribute reflects permission.')
  t.ok(forced, 'Forced permission recognized.')

  t.end()
})
