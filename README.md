# IAM

A identification and authorization manager for the browser and Node.js.
This library manages roles and permissions, allowing developers to create
simple or complex authorization patterns.

This is available as a commonJS node module, an importable ES Module, or
a global browser namespace.

## General Premise

Checking whether a user is authorized to view/use a specific feature of an application should always be a binary operation. In other words, the code should reflect a simple answer to the question of "is the user authorized to use a specific resource". It should _not_ reflect a more complicated question, such as "is the user authorized to use this feature, or are they part of a group that can access this feature, or have they been explicitly denied access to a feature...". Just like writing sentences, code shouldn't have "run on" logic.

This library keeps track of resources, rights, roles, and groups. By maintaining the permission structure internally, it automatically derives permissions, even in complex schemas.

**Resources** are arbitrary names associated with an application, such as `admin portal`, `user settings`, or an any other component of a system where access should be controlled. Developers can also associate **rights** with each of these resources.

  For example, the `admin portal` resource may have `view` and `manage` rights associated with it. Users who are granted `view` rights should be able to see the `admin portal`, while users with `manage` rights can do something in the admin portal. Users without either of these rights shouldn't see the admin portal at all.

To control access, developers create **roles** and assign them to **users**. A role is assigned rights to specific resources. Users can then be assigned to roles.

**Groups** can be assigned users, roles, and even other groups. Groups allow developers to define simple or complex permission hierarchies.

By using each of these major components (resources, rights, roles, users, groups), the permission structure of your applications become significantly easier to manage. In turn, authorizing users becomes a trivial task with the `IAM.User` object. See examples in the usage section below.

## Installation

*Installing for Node.js*

`npm install @butlerlogic/iam -S`

```javascript
import IAM from '@butlerlogic/iam'
// OR
const iam = require('iam')
const iam = new IAM()
```

*Installing for the browser (ES Module)*

```html
<script type="module">
  import IAM from 'https://cdn.jsdelivr.net/npm/@butlerlogic/iam/src/main.min.js'

  let user = new IAM.User('roleA', 'roleB')
</script>
```

*Installing for the browser as a global namespace*

```html
<script src="https://some.cdn.com/iam"></script>
<script type="text/javascript">
  let user = new IAM.User('roleA', 'roleB')
</script>
```

## Usage (API)

### Resources & Rights

Resources can be thought of as components of a system. For example, in a UI, there may be several different pages/tools available to users. Each page/tool could be a unique resource. A basic web application may have a user page, admin section, and a few tools. All of these could be resources. It is up to the developer to identify and organize resources within the system.

Rights can be thought of as actions, permissions, features, etc. Rights often represent what a user can or can't see/do. Like resources, rights are just an arbitrary label, so developers can call it whatever they want. The naming is less important than understanding there is a relationship between resources and rights (resources have rights).

_Creating a single resource:_

```javascript
IAM.createResource('admin portal', ['view', 'manage'])
```

_Creating bulk resources:_

```javascript
IAM.createResource({
  'admin portal': ['view', 'manage'],
  'profile page': ['view'],
  'tool': ['view']
})
```

_Modifying resources:_

There is no specific "modification" feature. Just create the resource again to overwrite any existing resources/rights.

_Deleting one or more resources:_

```javascript
IAM.removeResource('admin portal', 'tool', ...)

// To remove all:
IAM.clearResources()
```

_Viewing available resources:_

```javascript
console.log(IAM.resources)
```
```json
{
  "admin portal": ["view", "manage"],
  "profile page": ["view"],
  "tool": ["view"]
}
```

### Roles

Roles are used to map system resources/rights to users. A role consists of resources and which rights should be enforced.

_Creating a role:_

The example below creates a simple administrative role called "admin". This role grants `view` and `manage` **rights** on the admin portal **resource**.

```javascript
IAM.createRole('admin', {
  'admin portal': ['view', 'manage']
})
```

_Granting all rights:_

For situations where all rights need to be granted on a specific resource, a shortcut `*` value can be used.

```javascript
IAM.createRole('admin', {
  'admin portal': '*'
})
```

_DENY rights:_

To explicitly deny a right, preface the right with the `deny:` prefix.

```javascript
IAM.createRole('basic user', {
  'admin portal': ['deny:view', 'deny:manage']
})

// Alternatively
IAM.createRole('basic user', {
  'admin portal': 'deny:*'
})
```

_FORCE ALLOW rights:_

There are circumstances where a user may belong to more than one role, where one role denies a right and another allows it. For example, all users may be denied access to administration tool, but admins should be granted access to the tool. In this case, the admin rights must override the denied rights. This is accomplished by prefixing a right with the `allow:` prefix.

```javascript
IAM.createRole('basic user', {
  'admin portal': 'deny:*'
})

IAM.createRole('superuser', {
  'admin portal': 'allow:*'
})
```

If a user was assigned to both the `basic user` _and_ `superuser` roles, the user would be granted all permissions to the admin portal because the `allow:*` right of the "superuser" role supercedes the `deny:*` right of the "basic user" role.

ALLOW RIGHTS ALWAYS SUPERCEDE DENIED RIGHTS. ALWAYS.

_Applying rights to everyone:_

There is a private/hidden role called `everyone` that is automatically assigned to all users. This reserved word can be used to assign permissions for all users of a system. To simplify, a special `all` method is available for configuring rights that apply to all users.

```javascript
IAM.all({
  'admin portal': 'deny:*',
  'user portal': 'view', // A single string is valid
  'tool': ['view'] // Arrays are also valid.
})
```

_Viewing roles/rights:_

The full list of roles and rights associated with them is available in the `IAM.roles` attribute.

```javascript
console.log(IAM.roles)
```
```json
{
  "admin portal": ["deny:view", "deny:manage"],
  "user portal": ["view", "manage"],
  "tool": ["view", "manage"]
}
```

### Users

Users can be assigned to roles, granting or denying access to system resources.

_Creating a user:_

```javascript
let user = new IAM.User()
user.name = 'John Doe'
```

Please note that user "name" does not necessarily refer to a person's name. It is merely an optional label to help identify a particular user (useful when viewing reports, groups of users, etc).

_Assigning users to a role:_

```javascript
user.assign('roleA')
user.assign('roleB', 'roleC')
```

There is also a shortcut to assign roles to a user when the user is created:

```javascript
let user = new IAM.User('admin', 'basic user')
```

In the example above, the user would automatically be assigned to the "admin" and "basic user" roles.

_Removing users from a role:_

```javascript
user.revoke('admin')
user.clear() // Removes all role assignments.
```

_Determining if a user is assigned to a role:_

```javascript
user.assignedTo('role')
user.of('role')
```

_Determining if a user is authorized to use a resource:_

```javascript
if (user.authorized('admin portal', 'manage')) {
  adminView.enable()
}
```

The code above states "if the user has the manage right on the admin portal, enable the admin view."

_Group membership:_

See the group section below.

### Group Management

... fill me in ...
