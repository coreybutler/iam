import test from 'tappedout'
import IAM, { User, Group } from '@author.io/iam'

test('Explicitly Assigned Rights', t => {
  IAM.reset()

  IAM.createResource({
    basic: IAM.USAGE,
    portal: IAM.USAGE
  })

  const basic_users = IAM.createRole('basic_users', {
    basic: 'view'
  })

  const super_users = IAM.createRole('super_users', {
    portal: ['view', 'deny:manage']
  })

  const admins = IAM.createGroup('admins').assign(super_users)

  IAM.createUser('basic_users')
  IAM.currentUser.assign('super_users')
  IAM.currentUser.setRight('portal', 'allow:manage')

  t.ok(IAM.currentUser.authorized('portal', 'manage'), 'Explicit rights applied first.')

  const trace = IAM.currentUser.trace('portal', 'manage')
  const { data } = trace

  t.expect('right', data.type, 'Lineage type recognized.')
  t.expect('portal', data.resource, 'Lineage resource recognized.')
  t.ok(data.granted, 'Permission recognized.')
  t.expect(null, data.governedBy.group, 'No group recognized.')
  t.expect(null, data.governedBy.role, 'No role recognized.')
  t.expect(1, trace.stack.length, 'Only one item exists in the lineage stack.')
  t.expect('manage (explicitly granted)', trace.display, 'Accurate display value.')
  t.expect('The "manage" right of the "portal" resource is explicitly granted to the user.', trace.description, 'Accurate simplified description.')

  t.end()
})
