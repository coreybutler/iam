import test from 'tappedout'
import IAM, { User } from '@author.io/iam'

test('User', t => {
  IAM.createResource('blog', ['create', 'read', 'update', 'delete'])
  IAM.createResource('users', ['create', 'read', 'update', 'delete'])
  IAM.createResource('other', ['create', 'read', 'update', 'delete'])

  IAM.createRole('admin', {
    blog: ['create', 'read'],
    users: 'allow:*'
  })

  const me = new User('admin')
  const { roleList } = me
  const names = new Set(roleList)

  t.expect(2, roleList.length, 'Recognized roles, including "everyone"')
  t.expect(true, names.has('everyone'), '"everyone" role recognized.')
  t.expect(true, names.has('admin'), 'Custom role recognized.')
  t.expect(true, me.of('admin'), 'Recognize when user is part of a role.')
  t.expect(false, me.assignedTo('DNE'), 'Fails to recognize non-existant role.')

  me.name = 'test user'
  me.description = 'basic user'
  t.expect('test user', me.name, 'Setting a descriptive name is reflected in name property.')
  t.expect('test user', IAM.currentUser.name, 'Current user reference reflects the appropriate properties.')
  t.expect('basic user', me.description, 'Setting a description is reflected in description property.')

  const { data } = me
  t.expect('user', data.type, 'Data identifies object type.')
  t.expect('test user', data.name, 'Data outputs name.')
  t.expect('basic user', data.description, 'Data outputs description.')
  t.expect(1, data.roles.length, 'Recognizes roles, ignoring the internal "everyone" role.')
  t.expect(0, data.groups.length, 'Recognizes groups (or lack thereof).')

  t.ok(me.authorized('blog', 'read', 'create'), 'Basic authorization.')
  t.ok(IAM.authorized(me, 'blog', 'read', 'create'), 'Basic authorization (using registry authorization function).')
  t.ok(!me.authorized('blog', 'delete'), 'Authorization fails for resource where right is not allowed.')
  t.ok(!IAM.authorized(me, 'blog', 'delete'), 'Authorization fails for resource where right is not allowed (using registry authorization function).')
  t.ok(!me.authorized('other', 'read'), 'Authorization fails for non-authorized resources.')
  t.ok(!IAM.authorized(me, 'other', 'read'), 'Authorization fails for non-authorized resources (using registry authorization function).')

  me.revoke('admin')
  t.expect(1, me.roleList.length, 'Revoke role')

  t.end()
})

test('User Expiration', t => {
  IAM.removeUser()
  let expireEventDetected = false
  const user = new User()
  user.TTL = 300

  t.expect(1, IAM.users.length, 'User exists until TTL expires.')

  user.on('expire', () => { expireEventDetected = true })

  setTimeout(() => {
    t.ok(expireEventDetected, '"expire" event detected upon TTL expiration.')
    t.expect(0, IAM.users.length, 'User no longer exists after TTL expiration.')
    t.end()
  }, 600)
})
