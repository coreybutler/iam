// import IAM from 'https://cdn.jsdelivr.net/npm/@butlerlogic/iam@1.0.0-beta5/src/main.js'
import IAM from '../../src/main.js'

// Define the system components
IAM.createResource({
  home: ['view'],
  blog: ['view', 'edit']
})

// Set defaults. Allow users to view the home
// and blog tabs, but deny access to the administrator.
IAM.all({
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
basicUser.name = 'John Doe (Basic)'

// Create an admin user
let adminUser = new IAM.User()
adminUser.name = 'Almighty Blogmaster (Admin)'

// Assign the admin user to the administrator role.
adminUser.assign('administrator_role')

window.currentUser = basicUser

// =============================================//


// Basic UI interaction
const snippet = document.querySelector('.home code')
const template = document.querySelector('author-cycle')
const userList = document.querySelector('header > select[name="user"]')

document.querySelectorAll('header a').forEach(link => {
  link.addEventListener('click', evt => {
    if (!evt.target.getAttribute('selected')) {
      evt.preventDefault()

      let displaySection = evt.target.getAttribute('id')


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
