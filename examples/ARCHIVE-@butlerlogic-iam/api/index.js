import express from 'express'
import http from 'http'
import api from '@butlerlogic/common-api'
import IAM from '../../src/main.js'

// Setup Express
const app = express()

// Create IAM System Resources & Rights
IAM.createResource('blog', ['create', 'read', 'update', 'delete', 'list'])

// Identify rights associated with all users of the system.
IAM.everyone({
  blog: ['read', 'list']
})

// Create a blog "master" role granting access to all blog resources.
IAM.createRole('blogmaster', { blog: 'allow:*' })

// Create an administrators group and assign it master rights.
IAM.createGroup('administrators').assign('blogmaster')

// IAM stores a reference to all users by default. It is possible to
// destroy/expire users after a certain amount of time, or to disable this
// tracking entirely. API's are typically stateless, meaning that
// every request is authenticated. In circumstances where authentication
// is happening on every request, it is better to **not** track users
// (reduces memory and prevents confusion)
IAM.disableUserTracking()

// Create an HTTP authorization method.
// This returns a middleware function that authenticates
// using a username/password combo and authorizes using IAM.
let requireAuthorization = (resource, right) => {
  return api.basicauth((username, password, grant, deny) => {
    let authenticated
    let allowed
    let user = new IAM.User()

    switch (username) {
      case 'johndoe':
        authenticated = password === 'avgjoe'
        allowed = user.authorized(resource, right)

        if (authenticated && allowed) {
          grant()
        } else {
          deny()
        }
        break

      case 'blogmaster':
        // The blogmaster is an administrator. Joing the group.
        user.join('administrators')

        authenticated = password === 'admin'
        allowed = user.authorized(resource, right)

        if (authenticated && allowed) {
          grant()
        } else {
          deny()
        }
        break

      default:
        deny()
    }
  })
}

api.applyCommonConfiguration(app) // Creates /ping, /version, and /info endpoints.

// Restricted Endpoints
app.get('/blogs', requireAuthorization('blog', 'list'), api.reply({ blogs: [{title: 'Title A', article: '...'}, {title: 'Title B', article: '...'}]}))
app.get('/blog/:id', requireAuthorization('blog', 'read'), api.reply({ title: 'Title', article: '...'}))
app.post('/blog/:id', requireAuthorization('blog', 'create'), api.CREATED)
app.put('/blog/:id', requireAuthorization('blog', 'update'), api.OK)
app.delete('/blog/:id', requireAuthorization('blog', 'delete'), api.OK)

// Fallback endpoint
app.get('/', api.OK)

// Launch the server
let server = http.createServer(app).listen(8100, () => console.log(`Server available at http://localhost:${server.address().port}`))
