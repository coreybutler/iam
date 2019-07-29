# IAM

A identification and authorization manager for the browser and Node.js.
This library manages roles and permissions, allowing developers to create
simple or complex authorization patterns.

This is available as a commonJS node module, an importable ES Module, or
a global browser namespace.

**Additional inline documentation is available.**

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

Groups are a simple but powerful organizational container. Groups have two types of members: users
and other groups.

Roles are assigned to groups, applying the permissions to all members of the group. For example, a user who is a member of the "admin" group will receive all of the same roles/privileges
assigned to the group.

Users inherit permissions from the groups they are a part of, but groups inherit permissions from the groups within them. For example, a group called "superadmin" contains a group called "admin". The "superadmin" group inherits all privileges from the "admin" group. This is a "reverse" cascade hierarchy, which allows privileges to be "rolled up" into higher order groups.

_Creating groups:_

```javascript
let group = IAM.createGroup('admin')
// or
let groups = IAM.createGroup('admin', 'profile', '...')
```

When a single group is created, the new group is returned (i.e. `group` in the first example). When multiple groups are created at the same time, an array of groups is returned (i.e. `groups` in the second example)

_Group descriptions:_

Sometimes (especially in reporting) it is useful to have a description of a group. A generic description is generated by default, but it's possible to supply a custom description using the `description` attribute.

```javascript
let group = IAM.createGroup('admin')

group.description = 'An administrative group.'
```

Descriptions are optional.

_Assigning roles/privileges to a group:_

```javascript
group.addRole('roleA', 'roleB')

let roleC = IAM.createRole('roleC', {...})

group.addRole(roleC)
```

It is possible to assign one or more roles at the same time. A role must be the unique name (string) of an existing role or the actual `IAM.Role` object.

_Removing roles/privileges from a group:_

```javascript
group.removeRole('roleA', roleC)
```

Similar to adding a role, supply one or more existing role name/`IAM.Role` objects to the `removeRole` method.

_Removing all roles from a group:_

`group.clearRoles()` clears all role assignments.

_Adding & removing users to a group:_

```javascript
let user = new IAM.User('John Doe')

group.addMember(user)
group.removeMember(user)
```

_Adding & removing subgroups to a group:_

```javascript
let group = new IAM.Group('admin')
let supergroup = new IAM.Group('superadmin')

// Groups can be added by IAM.Group object or by name
group.addMember(group)
// or
group.addMember('admin')

// Groups can be removed by IAM.Group object or by name
group.removeMember(group)
// or
group.removeMember('admin')
```

## Tracing Permission Lineage

There are situations when it is useful to know how/why a privilege was assigned to a user. For example, it's not uncommon to ask questions like "why does/n't John Doe have permission to the administration section?". The lineage system is designed to trace a permission back to the authorization source.

The `IAM.Group` and `IAM.User` objects both contain a `trace()` method for this. This method requires two arguments: `resource` (string/`IAM.Resource`) and `right` (string/`IAM.Right`).

Consider the following, where a system resource called `admin portal` exists, but everyone is denied access by default. A special role called `administrator` is created, which grants access to the `admin portal` resource. Using this structure, only members of the `administrator` role should have access to the `admin portal` resource.

```javascript
// Create a system resource and rights.
IAM.createResource({
  'admin portal', ['view', 'manage'],
})

// Deny admin portal rights for everyone.
IAM.all({
  'admin portal': 'deny:*'
})

// Create an "administrator" role for users who SHOULD be able to access the admin portal.
IAM.createRole('administrator', {
  'admin portal': 'allow:*'
})

// Create some administration groups
IAM.createGroup('partialadmin', 'admin', 'superadmin')

// Assign the administrator role to the partialadmin group.
IAM.getGroup('partialadmin').assign('administrator')

// Add the partialadmin group to the admin group,
// and add the admin group to the superadmin group.
IAM.getGroup('admin').addMember('partialadmin')
IAM.getGroup('superadmin').addMember('admin')

// Create a user
let user = new IAM.User('John Doe')

// Add the user to the superadmin group.
user.join('superadmin')

// The user should have access to view the admin portal.
console.log(user.authorized('admin portal', 'view')) // Outputs "true"
```

Perhaps the user "John Doe" shouldn't have access to the admin portal. Instead of being frustrated and wondering why that user has access when he shouldn't, use the trace method to quickly find out how permission was granted.

```javascript
console.log(user.trace('admin portal', 'view'))
```

The console output would look like:

```json
{
  display: "superadmin (group) <-- admin (subgroup) <-- partialadmin (subgroup) <-- administrator (role) <-- * (right to view)"
  governedBy: {
    group: Group {#oid: Symbol(superadmin group),…}
    right: Right {#oid: Symbol(allow:* right),…},
    role: Role {#oid: Symbol(admin role), …}
  },
  granted: true
  resource: Resource {#oid: Symbol(admin portal resource),…},
  right: "view",
  stack: (5) [Group, Group, Group, Role, Right],
  type: "role"
}
```

The `display` object is the most descriptive. It can be read as "The user is a member of the superadmin group, which inherits rights of the admin group, which further inherits rights from the partialadmin group. The partialadmin group is assigned the administrator role, which grants all privileges, including the right to view the admin portal.".

In this case, the user is just part of a group that he probably shouldn't be a member of... so fixing it is a matter of removing the user from the group. The important part of this trace feature is _you didn't have to hunt through an entire application code base to find out which group_.

The lineage/trace tool also supports explicitly denied rights (i.e. `deny:xxx`). It will return `null` if there is no lineage.

Lineage is parsed into several additional attributes, purely for ease of use.

The `stack` attribute provides references to the full lineage, including all elements that were responsible for assigning/revoking the specified privileges. This is the same as the `display` attribute, but provides a programmatic trace instead of a descriptive trace.

The `governedBy` attribute provides the highest level group, role, and right. The `granted` attribute determines whether the right was allowed or not. The `resource` attribute is a reference to the system resource, and the `right` attribute is the actual right.

The `type` attribute indicates whether a role the permission was granted/revoked by a "role" or "group" assigned to the user.
