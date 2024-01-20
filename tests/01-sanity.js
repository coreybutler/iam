import test from 'tappedout'
import { Domain } from '@author.io/iam'

let domain

test('Sanity Checks', t => {
  t.ok(Domain !== undefined, 'Domain class exists as default export.')
  t.expect('function', typeof Domain, 'Domain class is a function.')

  try {
    domain = new Domain
  } catch (error) {
    domain = new Domain({
      name: 'Test Domain'
    })

    t.ok(true, 'Domain constructor errors if "name" property is not present.')
  }

  t.expect('Domain', domain.type, 'Domain has the correct "type" value.')
  t.expect('Test Domain', domain.name, 'Domain name matches the supplied value.')
  t.expect('', domain.description, 'Domain has default description.')

  t.end()
})

// test('Domain', t => {
//   t.end()
// })