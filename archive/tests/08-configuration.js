import test from 'tappedout'
import IAM, { User, Group } from '@author.io/iam'

const CRUD = ['create', 'read', 'update', 'delete']
let config = null

test('Generate Configuration', t => {
  IAM.reset()

  IAM.createResource({
    blog: CRUD,
    adminportal: CRUD,
    public: CRUD
  })

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

  const basic = new Group('basic')
  const admin = new Group('administrator')
  const owner = new Group('owner')
  const superuser = new Group('superuser')
  const superadmin = new Group('superadmin')
  const god = new Group('god')

  admin.assign('administrator_role')
  god.add(superadmin)
  god.assign('god_role')
  admin.add('basic')

  const adminUser = new User()
  adminUser.name = 'Admin Person'

  const goduser = new User('god_role')
  goduser.name = 'Master of All'

  adminUser.join(admin)
  goduser.join('god')

  const { configuration } = IAM
  config = configuration

  t.expect(3, configuration.resources.length, 'Identifies resources.')
  t.expect(3, configuration.roles.length, 'Identifies roles.')
  t.expect(6, configuration.groups.length, 'Identifies groups.')
  t.expect(2, configuration.users.length, 'Identifies users.')

  t.end()
})

test('Load Configuration', t => {
  if (config === null) {
    t.fail('No configuration generated.')
    t.end()
  } else {
    config.groups.push({
      name: 'test',
      description: 'testers',
      type: 'group',
    })

    IAM.load(config)
    const { configuration } = IAM

    t.expect(3, configuration.resources.length, 'Identifies resources after load.')
    t.expect(3, configuration.roles.length, 'Identifies roles after load.')
    t.expect(7, configuration.groups.length, 'Identifies groups after load.')
    t.expect(2, configuration.users.length, 'Identifies users after load.')

    t.end()
  }
})