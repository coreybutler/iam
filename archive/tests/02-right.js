import test from 'tappedout'
import { Right } from '@author.io/iam'

test('Basic Rights/Permissions', t => {
  const right = new Right('create')

  t.expect('create', right.title, 'Reflects title.')
  t.expect(false, right.all, 'Explicit right not defined as *.')
  t.expect(true, right.granted, 'Granted by default.')
  t.expect(false, right.denied, 'Not denied by default.')
  t.expect(false, right.forced, 'Right is not forcibly applied.')
  t.expect(true, right.is('create'), 'Permission detected using "is" method.')
  t.expect(false, right.is('created'), 'Permission not detected using "is" method (when invalid permission requested).')

  const { data } = right
  t.expect('create', data.name, 'Serialization includes name value.')
  t.expect('Grant create privilege.', data.description, 'Serialization includes description value.')
  t.expect('create', data.right, 'Serialization includes "right" (permission label) value.')
  t.expect(true, data.granted, 'Serialization includes allow/deny value.')

  t.end()
})

test('Denied Rights/Permissions', t => {
  const right = new Right('deny:create')

  t.expect('create', right.title, 'Reflects title.')
  t.expect(false, right.all, 'Explicit right not defined as *.')
  t.expect(false, right.granted, 'Denied.')
  t.expect(true, right.denied, 'Denied by default.')
  t.expect(false, right.forced, 'Right is not forcibly applied.')
  t.expect(true, right.is('create'), 'Permission detected using "is" method.')
  t.expect(false, right.is('created'), 'Permission not detected using "is" method (when invalid permission requested).')

  const { data } = right
  t.expect('create', data.name, 'Serialization includes name value.')
  t.expect('Deny create privilege.', data.description, 'Serialization includes description value.')
  t.expect('deny:create', data.right, 'Serialization includes "right" (permission label) value.')
  t.expect(false, data.granted, 'Serialization includes allow/deny value.')

  t.end()
})

test('Force Allow', t => {
  const right = new Right('allow:create')

  t.expect(true, right.forced, 'Recognized when a right is force-allowed.')
  t.end()
})

test('Right Configuration', t => {
  const right = new Right({
    name: 'create',
    description: 'Custom description',
    granted: true
  })

  t.expect('create', right.title, 'Reflects title.')
  t.expect(false, right.all, 'Explicit right not defined as *.')
  t.expect(true, right.granted, 'Granted.')
  t.expect(false, right.denied, 'Granted by default.')
  t.expect(false, right.forced, 'Right is not forcibly applied.')
  t.expect(true, right.is('create'), 'Permission detected using "is" method.')
  t.expect(false, right.is('created'), 'Permission not detected using "is" method (when invalid permission requested).')
  t.expect('Custom description', right.description, 'Custom description recognized.')

  t.end()
})

test('Wildcard Rights', t => {
  const right = new Right('deny:*')

  t.expect('All', right.title, 'Reflects title.')
  t.expect(true, right.all, 'Explicit right not defined as *.')
  t.expect(false, right.granted, 'Denied.')
  t.expect(true, right.denied, 'Denied by default.')
  t.expect(false, right.forced, 'Right is not forcibly applied.')
  t.expect(true, right.is('create'), 'Permission detected using "is" method.')

  const { data } = right
  t.expect('*', data.name, 'Serialization includes name value.')
  t.expect('Deny all privileges.', data.description, 'Serialization includes description value.')
  t.expect('deny:all', data.right, 'Serialization includes any "right" (permission label) value.')
  t.expect(false, data.granted, 'Serialization includes allow/deny value.')

  t.end()
})