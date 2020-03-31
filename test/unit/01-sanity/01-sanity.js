import 'source-map-support/register.js'
import test from 'tape'
import IAM from '../../.node/index.js'

test('Sanity Checks', t => {
  t.ok(IAM !== undefined, 'Library is instantiated.')
  t.end()
})