import IAM from '../src/main.js'
import tape from 'tape'

const { test } = tape

test('Library Components', t => {
  t.ok(true, 'yo')
  // t.ok(typeof IAM === 'object', 'The IAM namespace exists.')
  t.end()
})
