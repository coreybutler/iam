// import IAM from 'https://cdn.jsdelivr.net/npm/@butlerlogic/iam@1.0.0-beta5/src/main.js'
import IAM from '../../src/main.js'

// Define the system components
IAM.createResource({
  home: ['view'],
  blog: ['view', 'edit']
})

// Set defaults. Allow users to view the home
// and blog tabs, but deny access to the administrator.
IAM.everyone({
  home: '*',
  blog: ['view', 'deny:edit']
})

// Create an admin role
IAM.createRole('administrator_role', {
  blog: ['allow:edit']
})

// Create a basic user
let basicUser = new IAM.User()

// Optionally give the user a descriptive name.
basicUser.name = 'John Doe'

// Create an admin user
let adminUser = new IAM.User()
adminUser.name = 'Almighty Blogmaster'

// Assign the admin user to the administrator role.
// adminUser.assign('administrator_role')

window.currentUser = basicUser

// =============================================//

// Groups
let adminGroup = IAM.createGroup('administrator')
let groups = IAM.createGroup('writer', 'reader')

IAM.getGroup('writer').addMember('reader', 'administrator')

adminGroup.assign('administrator_role')
adminUser.join('administrator')

// =============================================//

// UI

// Basic UI interaction
const snippet = document.querySelector('.home code:last-of-type')
const template = document.querySelector('author-cycle')
const userList = document.querySelector('header > select[name="user"]')

document.querySelectorAll('header a').forEach(link => {
  link.addEventListener('click', evt => {
    if (!evt.target.getAttribute('selected')) {
      evt.preventDefault()

      let displaySection = evt.target.getAttribute('id')

      let resource = displaySection !== 'home' ? 'blog' : 'home'
      let permission = displaySection === 'editor' ? 'edit' : 'view'

      if (!currentUser.authorized(resource, permission)) {
        alert(`Sorry ${currentUser.name}, you aren't authorized to see that section.\n\n${currentUser.trace(resource, permission).description}`)
        return
      }

      try {
        console.log(`Checking if ${currentUser.name} has "${permission}" right on the "${resource}" resource.`)
        console.log(currentUser.trace(resource, permission).description)
      } catch (e) {
        console.error(e)
        console.log(resource, permission)
        console.log(currentUser.trace(resource, permission))
      }

      template.show(`.${displaySection}`)
    }
  })
})

userList.addEventListener('change', evt => {
  currentUser = IAM.users[parseInt(evt.target.selectedOptions[0].value, 10)]
  snippet.innerHTML = userData()
})

IAM.users.forEach((user, index) => {
  userList.insertAdjacentHTML('beforeend', `<option value="${index}">${user.name}</option>`)
})

let userData = () => {
  return JSON.stringify(currentUser.data, null, 2).trim()
    + '\n\n// Rights\n' + JSON.stringify(currentUser.rights, null, 2).trim()
}

snippet.innerHTML = userData()

const resourceTable = document.querySelector('.resources table')
IAM.resources.forEach(resource => {
  resourceTable.insertAdjacentHTML('beforeend', `<tr><td>${resource.name}</td><td>${resource.data.rights.join(', ')}</td></tr>`)
})


const roleTable = document.querySelector('.roles table tbody')
IAM.roles.forEach(role => {
  let rights = ''

  role.rights.forEach((right, name) => {
    right.forEach(privilege => {
      rights += `<div class="permission_${privilege.allowed ? 'granted' : 'denied'}">${name}: ${privilege.allowed ? 'allowed' : 'denied'}</div>`
    })
  })

  roleTable.insertAdjacentHTML('beforeend', `<tr><td class="role_${role.name}">${role.name}</td><td>${rights}</td></tr>`)
})


const groupTable = document.querySelector('.groups table tbody')
IAM.groups.forEach(group => {
  groupTable.insertAdjacentHTML('beforeend', `<tr><td>${group.name}</td><td>${group.roleList.join('<br/>')}</td><td>${group.members.map(m => m.name + (m instanceof IAM.Group ? ' (group)' : '')).join('<br/>')}</td></tr>`)
})
