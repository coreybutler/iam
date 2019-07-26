import IAM from '../src/main.js'

window.IAM = IAM

// Top Level Navigation
const nav = document.querySelector('author-cycle')
Array.from(document.querySelectorAll('header > nav > a')).forEach(navlink => {
  navlink.addEventListener('click', evt => {
    evt.target.parentNode.querySelector('.selected').classList.remove('selected')
    evt.target.classList.add('selected')

    nav.show(document.getElementById(evt.target.getAttribute('target')))
  })
})

// 1. Identify Resources: resource name / actions & features
IAM.createResource('admin portal', ['view', 'manage'])

// Multiple resource registration
IAM.createResource({
  settings: ['view', 'manage', 'admin'],
  profile: ['view', 'manage', 'admin'],
  'super secret section': ['admin']
})

// Data
console.warn('RESOURCES:')
console.log(IAM.resources)
console.log(IAM.resourceNames)

// 2. Create authorization roles
IAM.createRole('admin', {
  'admin portal': ['allow:*']
})

IAM.createRole('superadmin', {
  'super secret section': ['allow:*']
})

// Grant resource rights to everyone.
IAM.all({
  'admin portal': 'deny:*',
  settings: '*',
  profile: ['view', 'manage']
})

console.warn('ROLES:')
console.log(IAM.roles)
console.log(IAM.roleNames)

// 3. Authorize
let user = new IAM.User('admin')
user.name = 'Test User'

let resource = 'settings'
let right = '*'

console.log(`User ${user.authorized(resource, right) ? 'is' : 'is NOT'} granted ${right} rights on ${resource} resource.`)

// ---
resource = 'admin portal'
right = 'manage'

user.revoke('admin')
console.error(`User ${user.authorized(resource, right) ? 'is' : 'is NOT'} granted ${right} rights on ${resource} resource.`)

user.assign('admin')
console.log(`User ${user.authorized(resource, right) ? 'is' : 'is NOT'} granted ${right} rights on ${resource} resource.`)

console.table(user.rights)


console.table(IAM.userlist)
console.log(IAM.users)

// -- Groups --
IAM.createGroup('admin', 'subadmin', 'superadmin')
IAM.getGroup('subadmin').addRole('admin')
IAM.getGroup('admin').addMember('subadmin')
IAM.getGroup('superadmin').addRole('superadmin').addMember('admin')
console.table(IAM.grouplist)
console.log(IAM.groups)

user.revoke('admin')
console.log(user.roles)
// user.join('admin')
user.join('superadmin')
console.log('USER ROLES', user.roleNames)
console.table(user.groups)
console.log('---')
console.table(user.rights)
console.log('---')
console.log(user.authorized('admin portal', 'manage'))
console.log(user.authorized('super secret section', 'admin'))


console.log(user.summary)
console.log(user.trace('admin portal', 'manage'))
console.log(user.lineage('admin portal', 'manage'))
