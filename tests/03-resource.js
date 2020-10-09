import test from 'tappedout'
import IAM, { REGISTRY_ID, Resource } from '@author.io/iam'

test('Basic Resources', t => {
  const resource = new Resource('blog', 'create', 'read', 'update', 'deny:delete')
  const rights = new Set(resource.rights.map(r => r.name))

  t.expect('blog', resource.name, 'Named resource.')
  t.expect(true, rights.has('create'), 'Create right.')
  t.expect(true, rights.has('read'), 'Read right.')
  t.expect(true, rights.has('update'), 'Update right.')
  t.expect(true, rights.has('delete'), 'Delete right exists denied.')

  t.end()
})

test('Create via Registry', t => {
  const resource = IAM.createResource('admin', ['create', 'read', 'update', 'deny:delete'])
  const rights = new Set(resource.rights.map(r => r.name))

  t.expect('admin', resource.name, 'Named resource.')
  t.expect(true, rights.has('create'), 'Create right.')
  t.expect(true, rights.has('read'), 'Read right.')
  t.expect(true, rights.has('update'), 'Update right.')
  t.expect(true, rights.has('delete'), 'Delete right exists denied.')

  t.end()
})

test('Registry Recognition', t => {
  const { resources, resourceList } = IAM
  const list = new Set(resourceList)

  t.expect(2, resources.length, 'Query engine recognizes previously created resources.')
  t.ok(list.has('admin') && list.has('blog'), 'Resources are recognized by name.')

  const admin = IAM.resource('admin')

  t.expect(true, admin instanceof Resource, 'IAM.resource returns the appropriate Resource object.')
  t.expect(null, IAM.resource('DNE'), 'Unrecognized resource returns null.')

  t.end()
})

test('Registry Data', t => {
  const { data } = IAM

  t.expect('IAM', data.name, 'Recognize system name.')
  t.expect('IAM system registry.', data.description, 'Recognize system description.')
  t.expect(2, data.resources.length, 'Recognize resources.')
  t.expect('blog', data.resources[1].name, 'Correctly identify resource by name.')
  t.expect('admin', data.resources[0].name, 'Correctly identify alternative resource by name.')

  t.end()
})

test('Delete Resource', t => {
  IAM.removeResource('admin')
  t.expect(1, IAM.resources.length, 'Resources removed by name')

  IAM.removeResource(IAM.resources[0])
  t.expect(0, IAM.resources.length, 'Resources removed by class/instance.')

  t.end()
})