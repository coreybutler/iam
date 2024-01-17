import test from 'tappedout'
import IAM, { Resource, Right } from '@author.io/iam'

test('Sanity Checks', t => {
  t.ok(IAM !== undefined, 'IAM registry exists as default export.')
  t.expect('function', typeof IAM.Base, 'Hidden base class recognized.')
  t.expect('function', typeof Right, 'Right class recognized.')
  t.expect('function', typeof Resource, 'Resource class recognized.')
  t.end()
})

test('Base Class', t => {
  const base= new IAM.Base()

  t.expect('component', base.type, 'Default type.')
  t.expect('Unknown', base.name, 'Class has default name.')
  t.expect('', base.description, 'Class has default description.')
  t.expect('symbol', typeof base.OID, 'Unique ID recognized.')

  const data = base.data
  t.expect('Unknown', data.name, 'Data contains name.')
  t.expect('', data.description, 'Data contains description.')

  base.on('done', () => t.end())

  base.on('test', () => {
    t.pass('Event handler triggered')

    base.emit('onetime', false)
    base.emit('onetime', true)

    t.end()
  })

  base.once('description.modified', delta => {
    t.expect('', delta.old, 'Old description passed in event payload upon name change.')
    t.expect('test description', delta.new, 'New description passed in event payload upon name change.')
    base.emit('done')
  })

  base.once('name.modified', delta => {
    t.expect('Unknown', delta.old, 'Old name passed in event payload upon name change.')
    t.expect('test', delta.new, 'New name passed in event payload upon name change.')

    base.description = 'test description'
  })

  base.once('onetime', payload => {
    if (payload) {
      t.fail('One time event fired triggered than once.')
    }

    t.pass('One time event triggered.')

    base.name = 'test'
  })

  base.emit('test')
})

test('Base Class Event Relay', t => {
  const base = new IAM.Base()
  const target = new IAM.Base()

  base.relay(target, 'altered')

  target.on('altered.name.modified', delta => {
    t.expect('Unknown', delta.old, 'Old name passed in event payload upon relayed name change.')
    t.expect('test', delta.new, 'New name passed in event payload upon relayed name change.')
    t.end()
  })

  base.name = 'test'
})