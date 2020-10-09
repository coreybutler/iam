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

// 1. Load data from localstorage
let cfg = localStorage.getItem('tmp.iam.cfg')

try {
  cfg = JSON.parse(cfg)
  IAM.load(cfg)
} catch (e) {}

// 2. Load system resources
let system_resources = document.querySelector('#resources')
let resource_rights = document.querySelector('#resource_rights')

IAM.resources.forEach(resource => system_resources.insertAdjacentHTML('beforeend', `<option value="${resource.name}">${resource.name}</option>`))

system_resources.addEventListener('change', evt => {
  resource_rights.innerHTML = ''

  IAM.getResource(evt.target.selectedOptions[0].value).rights.forEach(right => {
    resource_rights.insertAdjacentHTML('beforeend', `<option value="${right.name}">${right.name}</option>`)
  })
})

// 3. Load roles
let roles = document.querySelector('#role')
let role_resources = document.querySelector('#role_resources')
let role_resource_rights = document.querySelector('#role_resource_rights')

IAM.roles.forEach(role => roles.insertAdjacentHTML('beforeend', `<option value="${role.name}">${role.name}</option>`))

roles.addEventListener('change', evt => {
  role_resources.innerHTML = ''
  let role = IAM.getRole(evt.target.selectedOptions[0].value)

  role.resources.forEach((resource, label) => {
console.log(label, resource)
    role_resources.insertAdjacentHTML('beforeend', `<option value="${label}">${label}</option>`)
  })
})

// 1. Identify Resources: resource name / actions & features
IAM.reset()
IAM.createResource('admin portal', ['view', 'manage'])
//
// // Multiple resource registration
IAM.createResource({
  settings: ['view', 'manage', 'admin'],
  profile: ['view', 'manage', 'admin'],
  'super secret section': ['admin']
})
//
// // Data
// console.warn('RESOURCES:')
// console.log(IAM.resources)
// console.log(IAM.resourceNames)
//
// // 2. Create authorization roles
IAM.createRole('admin', {
  'admin portal': ['allow:*']
})

IAM.createRole('superadmin', {
  'super secret section': ['allow:*']
})

// Grant resource rights to everyone.
IAM.everyone({
  'admin portal': 'deny:*',
  settings: '*',
  profile: ['view', 'manage']
})
//
// console.warn('ROLES:')
// console.log(IAM.roles)
// console.log(IAM.roleNames)
//
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
user.join('admin')
user.join('superadmin')
console.log('USER ROLES', user.roleNames)
console.table(user.groupNames)
console.log('---')
console.table(user.rights)
console.log('---')
console.log(user.authorized('admin portal', 'manage'))
console.log(user.authorized('super secret section', 'admin'))


console.log(user.summary)
console.log(user.trace('admin portal', 'manage').data)

console.log('============')
console.log(JSON.stringify(IAM.configuration))
localStorage.setItem('tmp.iam.cfg', JSON.stringify(IAM.configuration))



console.log('Configuration Test')
console.log('Before Reset', IAM.configuration)
IAM.reset()
console.log('After Reset', IAM.configuration)
IAM.load(cfg)
console.log('Loaded', IAM.configuration)
