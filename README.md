# IAM

IAM is a lightweight identification and authorization library for JavaScript. It
models an application's resources, rights, roles, and users inside a `Domain`,
then resolves conflicting permissions into simple authorization decisions.

The package is an ES module and exports one public entry point: `Domain`.

## Install

```sh
npm install @author.io/iam
```

```js
import { Domain } from '@author.io/iam'
```

## Quick Start

Create a domain, define the resources your application protects, assign
permissions to roles, and assign roles to users:

```js
import { Domain } from '@author.io/iam'

const domain = new Domain({
  name: 'My Application',

  resources: [{
    name: 'Articles',
    rights: ['read', 'write', 'publish']
  }],

  roles: [{
    name: 'Editor',
    permissions: {
      Articles: ['read', 'write']
    }
  }],

  users: [{
    name: 'Ada',
    roles: ['Editor']
  }]
})
```

Retrieve the user from the domain, then retrieve the ACL for the resource you
want to check:

```js
const user = domain.getUser('Ada')
const articles = user.getACL('Articles')

articles.allows('read')                  // true
articles.allows('publish')               // false
articles.allowsEach('read', 'write')     // true
articles.allowsSome('write', 'publish')  // true
```

For a single authorization check, `isAuthorized()` is a convenient shortcut:

```js
user.isAuthorized('Articles', 'write') // true
```

Checking an unknown right throws an error. Define a resource's rights before
assigning permissions for them to keep the authorization model valid.

## Core Model

- A **Domain** contains the complete authorization model.
- A **Resource** is something protected by the domain, such as `Articles` or
  `Billing`.
- A **Right** is an action supported by a resource, such as `read` or `manage`.
- A **Role** collects permissions and may inherit other roles.
- A **User** receives permissions directly and through assigned roles.
- An **ACL** answers authorization questions for one user or role and one
  resource.

Names identify resources, roles, users, and rights within the API.

## Configure a Domain

`Domain` accepts the complete model as a configuration object:

```js
const domain = new Domain({
  name: 'Acme',
  description: 'Authorization for Acme products',

  resources: [{
    name: 'Reports',
    description: 'Customer reports',
    rights: [
      'read',
      {
        name: 'export',
        description: 'Export a report'
      }
    ]
  }],

  roles: [{
    name: 'Analyst',
    permissions: {
      Reports: ['read', 'deny:export']
    }
  }, {
    name: 'Senior Analyst',
    roles: ['Analyst'],
    permissions: {
      Reports: ['priority allow:export']
    }
  }],

  users: [{
    name: 'Grace',
    roles: ['Senior Analyst'],
    permissions: {
      Reports: ['force allow:export']
    }
  }]
})
```

Resources, roles, and users may also be supplied as strings when only a name is
needed:

```js
const domain = new Domain({
  name: 'Acme',
  resources: ['Dashboard'],
  roles: ['Member'],
  users: ['Lin']
})
```

Resources must be configured before permissions that refer to them.

## Permissions and Precedence

A permission is written as `<type>:<right>`. Plain right names are shorthand
for an allow permission:

```js
read          // equivalent to allow:read
deny:write
force allow:publish
```

Users and roles may receive multiple conflicting permissions for the same
resource and right. IAM assigns each permission type a weight; the permission
with the highest weight wins.

| Weight | Available to | Permission type |
| ---: | --- | --- |
| 1 | Role | `allow` |
| 2 | Role | `deny` |
| 3 | Role | `priority allow` |
| 4 | Role | `priority deny` |
| 5 | User | `deny` |
| 6 | User | `allow` |
| 7 | Role | `override deny` |
| 8 | Role | `override allow` |
| 9 | User | `force deny` |
| 10 | User | `force allow` |

This gives direct user permissions more authority than ordinary role
permissions while still allowing explicit role overrides and final user-level
force permissions.

```js
const user = domain.getUser('Grace')

user.addPermission('Reports', 'deny:export')
user.addPermission('Reports', 'force allow:export')

user.isAuthorized('Reports', 'export') // true
```

The active maps are available from `role.weights` and `user.weights`. Advanced
consumers can customize the scoring model in `src/Constants.js` when producing
a custom build.

## Role Inheritance

Roles can include other roles. Permissions are inherited recursively:

```js
const domain = new Domain({
  name: 'Acme',

  resources: [{
    name: 'Projects',
    rights: ['read', 'manage']
  }],

  roles: [{
    name: 'Viewer',
    permissions: {
      Projects: ['read']
    }
  }, {
    name: 'Manager',
    roles: ['Viewer'],
    permissions: {
      Projects: ['manage']
    }
  }],

  users: [{
    name: 'Katherine',
    roles: ['Manager']
  }]
})

const user = domain.getUser('Katherine')

user.hasDirectRole('Manager') // true
user.hasIndirectRole('Viewer') // true
user.hasRole('Viewer')         // true
user.isAuthorized('Projects', 'read')   // true
user.isAuthorized('Projects', 'manage') // true
```

### Universal Role

Every domain has a reserved `Universal` role that is automatically assigned to
every user. Configure it to grant baseline permissions:

```js
const domain = new Domain({
  name: 'Acme',

  resources: [{
    name: 'Help',
    rights: ['read']
  }],

  universalRole: {
    permissions: {
      Help: ['read']
    }
  },

  users: ['Ada', 'Grace']
})
```

The universal role is available as `domain.universalRole`. Its name can be
changed with `universalRole.name`, but it cannot be removed from the domain or
unassigned from a user.

## Work with ACLs

Call `getACL(resourceName)` on a user or role. ACLs remain current as
permissions and roles change.

```js
const user = domain.getUser('Ada')
const acl = user.getACL('Articles')

acl.allows('read')                   // one right
acl.allowsEach('read', 'write')      // every listed right
acl.allowsSome('write', 'publish')   // at least one listed right
acl.allowsAll                        // every right on the resource
acl.allowsAny                        // at least one right on the resource
acl.permissions                     // contributing permission strings
```

To inspect why a permission won, retrieve its lineage:

```js
const lineage = acl.getLineage('read')

console.log(lineage?.description)
console.log(lineage?.path)
console.log(lineage?.permission.toString())
```

`getLineage()` returns `null` when no permission resolves for the requested
right.

## Change the Domain at Runtime

The same model can be assembled or changed after construction:

```js
const domain = new Domain({ name: 'Acme' })

const reports = domain.addResource({
  name: 'Reports',
  rights: ['read']
})

reports.addRight('export')

const analyst = domain.addRole({
  name: 'Analyst',
  permissions: {
    Reports: ['read']
  }
})

analyst.addPermission('Reports', 'export')

const user = domain.addUser({
  name: 'Margaret',
  roles: ['Analyst']
})

domain.addRole('Reviewer')
user.addRole('Reviewer')
user.removeRole('Reviewer')
user.addPermission('Reports', 'deny:export')
user.replacePermission('Reports', 'deny:export', 'allow:export')
user.removePermission('Reports', 'allow:export')
```

Domain collections and lookup methods:

```js
domain.resources
domain.roles
domain.users

domain.getResource('Reports')
domain.getRole('Analyst')
domain.getUser('Margaret')

domain.hasResource('Reports')
domain.hasRole('Analyst')
domain.hasUser('Margaret')

domain.removeRole('Analyst')
domain.removeUser('Margaret')
```

Resource rights can be managed through the resource:

```js
const resource = domain.getResource('Reports')

resource.rights
resource.getRight('read')
resource.hasRight('read')
resource.hasRights('read', 'export')
resource.addRight('archive')
```

Add roles before assigning them to users or other roles. Assigning an unknown
role does not fail immediately, but it contributes no permissions until a role
with that name exists.

## Inspect Permissions

Users and roles expose both direct and inherited permissions:

```js
user.getDirectPermission('Reports', 'read')
user.getDirectPermissions('Reports')
user.hasDirectPermission('Reports', 'allow:read')

user.getIndirectPermission('Reports', 'read')
user.getIndirectPermissions('Reports')
user.hasIndirectPermission('Reports', 'allow:read')

user.getPermission('Reports', 'read')
user.getPermissions('Reports')
user.hasPermission('Reports', 'allow:read')
```

The singular `get*Permission()` methods return the winning `Permission`.
Plural methods return all matching permissions. Calling `getPermissions()`
without a resource returns the effective permissions grouped by resource.

## Serialize the Model

Every named entity exposes `name`, `description`, `type`, and a unique symbol
at `oid` (also available as `OID`).

```js
domain.data       // plain object representation
domain.toString() // JSON string representation
```

## API Overview

### `Domain`

```text
addResource(config)   getResource(name)   hasResource(name)
addRole(config)       getRole(name)       hasRole(name)       removeRole(name)
addUser(config)       getUser(name)       hasUser(name)       removeUser(name)
```

### `User` and `Role`

```text
getACL(resource)
isAuthorized(resource, right)

addRole(name)         removeRole(name)
hasRole(name)         hasDirectRole(name)         hasIndirectRole(name)

addPermission(resource, permission)
replacePermission(resource, permission, replacement)
removePermission(resource, permission)

getPermission(resource, right)
getPermissions(resource?, right?)
getDirectPermission(resource, right)
getDirectPermissions(resource, right?)
getIndirectPermission(resource, right)
getIndirectPermissions(resource, right?)
```

### `ACL`

```text
allows(right)
allowsEach(...rights)
allowsSome(...rights)
allowsAll
allowsAny
permissions
getLineage(right)
```

## License

MIT
