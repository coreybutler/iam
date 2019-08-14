# IAM (Identification and Authorization Management)
_(For the browser and Node.js)_

This library manages roles and permissions, allowing developers to create simple or complex authorization patterns. It keeps track of resources, rights, roles, and groups. By maintaining the permission structure within the library (internally), it is capable of automatically deriving user rights, even in complex schemas.

**Determining whether a user is authorized to view/use a specific feature of an application should always be a binary operation.** In other words, the code should reflect the answer to a simple question: _"does the user have the right to do something with the system resource?"_.

**The goal:**

```javascript
if (user.authorized('system resource', 'view')) {
  display()
} else {
  throw new Error('Access Denied')
}
```

## Shortcuts

- [Why? (Including Examples)](abstracting-complexity)
- [Design Your Access Control System](#designing-your-access-control-system)
- [API Docs](#installation)
- [Tracing Permission Lineage](#tracing-permission-lineage)
- [Access Control Philosophy](https://github.com/coreybutler/iam/wiki)

---

## Abstracting complexity

Issues and confusion with authorization commonly occur when the conditional logic is too complicated.

**Consider the following authorization question:**

> "Is the user authorized to use this feature, or are they part of a group that can access this feature, or have they been explicitly denied access to a feature, or are they part of a group that's part of another group that has permission, or are any permission overrides to account for?"

Just like proper sentences, **code shouldn't have "run on" logic**. You shouldn't have to be a mental gymnast to understand whether someone should have access to a feature or not. IAM abstracts this complexity.

### Demo UI

![IAM Example UI](https://github.com/coreybutler/iam/raw/master/examples/basic/IAM.png)

The code for this is available in the [basic example](https://github.com/coreybutler/iam/tree/master/examples/basic).


### Demo API

![IAM Example API](https://github.com/coreybutler/iam/raw/master/examples/api/api_example.png)

The code for this is available in the [api example](https://github.com/coreybutler/iam/tree/master/examples/api).

---

## Designing Your Access Control System

**Resources** are arbitrary names associated with an application, such as `admin portal`, `user settings`, or an any other component of a system where access should be controlled.

**Rights** are defined for each resource. For example, the `admin portal` resource may have `view` and `manage` rights associated with it. Users who are granted `view` rights should be able to see the `admin portal`, while users with `manage` rights can do something in the admin portal. Users without either of these rights shouldn't see the admin portal at all.

To grant/revoke access, developers create **roles** and assign them to **users** or **groups** of users. A role is assigned the rights of specific resources. Users and groups can then be assigned to these roles.

**Groups** can be assigned users, roles, and even other groups. Groups allow developers to define simple or complex permission hierarchies.

By using each of these major components (resources, rights, roles, users, groups), the permission structure of your applications become significantly easier to manage. In turn, authorizing users becomes a trivial task with the `IAM.User` object. See examples in the usage section below.

---

## Installation

This is available as an importable ES Module. If you're interested in a CommonJS version, or a version compatible with older browsers, post an issue.
I plan to do this, but will prioritize efforts based on community demand.

A guide and high level API documentation are below. **See the source code for additional inline documentation.**

### Installing for Node.js >=12

`npm install @butlerlogic/iam -S`

```javascript
import IAM from '@butlerlogic/iam'
```

_Remember_, modules in Node.js are experimental. To use them,
you must set the `type` in the `package.json` file:

```hcl
{
  "type": "module"
}
```

The script must be executed using the `--experimental-modules` flag:

`node --experimental-modules index.js`

See the [api example](https://github.com/coreybutler/iam/tree/master/examples/api) for a working example.

### Installing for the browser

```html
<script type="module">
  import IAM from 'https://cdn.jsdelivr.net/npm/@butlerlogic/iam@latest/src/main.min.js'

  let user = new IAM.User('roleA', 'roleB')
</script>
```

---

# API Usage (API)

## Resources & Rights

Resources can be thought of as components of a system. For example, in a UI, there may be several different pages/tools available to users. Each page/tool could be a unique resource. A basic web application may have a user page, admin section, and a few tools. All of these could be resources. It is up to the developer to identify and organize resources within the system.

Rights can be thought of as actions, permissions, features, etc. Rights often represent what a user can or can't see/do. Like resources, rights are just an arbitrary label, so it can be named any way you want. The naming is less important than understanding there is a relationship between resources and rights (resources have rights).

### Creating a single resource

```javascript
// IAM.createResource('resource', rights)
IAM.createResource('admin portal', ['view', 'manage'])
```

### Creating bulk resources

```javascript
IAM.createResource({
  'admin portal': ['view', 'manage'],
  'profile page': ['view'],
  'tool': ['view']
})
```

### Modifying resources

There is no specific "modification" feature. Just create the resource again to overwrite any existing resources/rights.

### Deleting one or more resources

```javascript
IAM.removeResource('admin portal', 'tool', ...)

// To remove all:
IAM.clearResources()
```

### Viewing available resources

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

## Roles

Roles are used to map system resources/rights to users. A role consists of resources and which rights of the resource should be enforced.

### Creating a role

The example below creates a simple administrative role called "admin". This role grants `view` and `manage` **rights** on the admin portal **resource**.

```javascript
// IAM.createRole('role name', {
//   'resource': rights
// })

IAM.createRole('admin', {
  'admin portal': ['view', 'manage']
})
```

### Granting all rights

For situations where all rights need to be granted on a specific resource, a shortcut `*` value can be used.

```javascript
IAM.createRole('admin', {
  'admin portal': '*'
})
```

### DENY rights

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

### FORCIBLY ALLOW rights

There are circumstances where a user may belong to more than one role or group, where one role denies a right and another allows it. For example, users may be denied access to an administration tool by default, but admins should be granted special access to the tool. In this case, the admin rights must override the denied rights. This is accomplished by prefixing a right with the `allow:` prefix.

```javascript
IAM.createRole('basic user', {
  'admin portal': 'deny:*'
})

IAM.createRole('superuser', {
  'admin portal': 'allow:*'
})
```

If a user was assigned to both the `basic user` _and_ `superuser` roles, the user would be granted all permissions to the admin portal because the `allow:*` right of the "superuser" role supercedes the `deny:*` right of the "basic user" role.

> ALLOW RIGHTS ALWAYS SUPERCEDE DENIED RIGHTS. ALWAYS.

### Applying rights to everyone

There is a private/hidden role produced by IAM, called `everyone`. This role is always assigned to all users. It is used to assign permissions which are applicable to every user of the system. A special `all()` method simplifies the process of assigning rights to everyone.

```javascript
IAM.all({
  'resource': 'right',
  'admin portal': 'deny:*',
  'user portal': 'view', // A single string is valid
  'tool': ['view'] // Arrays are also valid.
})
```

### Viewing roles/rights

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

## Users

Users can be assigned to roles, granting or denying access to system resources.

### Creating a user

```javascript
let user = new IAM.User()
user.name = 'John Doe'
```

Please note that user "name" does not necessarily refer to a person's name. It is merely an optional label to help identify a particular user (useful when viewing reports, groups of users, etc).

### Assigning users to a role

```javascript
user.assign('roleA')
user.assign('roleB', 'roleC')
```

There is also a shortcut to assign roles to a user when the user is created:

```javascript
let user = new IAM.User('admin', 'basic user')
```

In the example above, the user would automatically be assigned to the "admin" and "basic user" roles.

### Removing users from a role

```javascript
user.revoke('admin')
user.clear() // Removes all role assignments.
```

### Determining if a user is assigned to a role

```javascript
user.assignedTo('role')
user.of('role')
```

### Determining if a user is authorized to use a resource

```javascript
if (user.authorized('admin portal', 'manage')) {
  adminView.enable()
}
```

The code above states "if the user has the manage right on the admin portal, enable the admin view."

### Group membership

See the group section below.

## Group Management

Groups are a simple but powerful organizational container. Groups have two types of members: users
and other groups.

Roles are assigned to groups, applying the permissions to all members of the group. For example, a user who is a member of the "admin" group will receive all of the same roles/privileges assigned to the "admin" group.

Users inherit permissions from the groups they are a part of, but groups inherit permissions from the groups within them. For example, a group called "superadmin" contains a group called "admin". The "superadmin" group inherits all privileges from the "admin" group. This is a "reverse" cascade hierarchy, which allows privileges to be "rolled up" into higher order groups.

### Creating groups

```javascript
let group = IAM.createGroup('admin')
// or
let groups = IAM.createGroup('admin', 'profile', '...')
```

When a single group is created, the new group is returned (i.e. `group` in the first example). When multiple groups are created at the same time, an array of groups is returned (i.e. `groups` in the second example)

### Group descriptions

Sometimes (especially in reporting) it is useful to have a description of a group. A generic description is generated by default, but it's possible to supply a custom description using the `description` attribute.

```javascript
let group = IAM.createGroup('admin')

group.description = 'An administrative group.'
```

Descriptions are optional.

### Assigning roles/privileges to a group

```javascript
group.assign('roleA', 'roleB')

let roleC = IAM.createRole('roleC', {...})

group.assign(roleC)
```

It is possible to assign one or more roles at the same time. A role must be the unique name (string) of an existing role or the actual `IAM.Role` object.

### Removing roles/privileges from a group

```javascript
group.revoke('roleA', roleC)
```

Similar to adding a role, supply one or more existing role name/`IAM.Role` objects to the `revoke` method.

### Removing all roles from a group

`group.clearRoles()` clears all role assignments.

### Adding & removing users to a group

```javascript
let user = new IAM.User('John Doe')

group.addMember(user)
group.removeMember(user)
```

### Adding & removing subgroups to a group

```javascript
let group = new IAM.Group('admin')
let supergroup = new IAM.Group('superadmin')

// Groups can be added by IAM.Group object or by name
supergroup.addMember(group)
// or
supergroup.addMember('admin')

// Groups can be removed by IAM.Group object or by name
supergroup.removeMember(group)
// or
supergroup.removeMember('admin')
```

---

# Tracing Permission Lineage

There are situations when it is useful to know how/why a privilege was assigned to a user. For example, it's not uncommon to ask questions like "why does/n't John Doe have permission to the administration section?". The lineage system is designed to trace a permission back to the authorization source. In other words, it helps identify which group, role, or inheritance pattern ultimately granted/denied access to a resource.

The `IAM.Group` and `IAM.User` objects both contain a `trace()` method for this. This method requires two arguments: `resource` (string/`IAM.Resource`) and `right` (string/`IAM.Right`).

Consider the following, where a system resource called `admin portal` exists, but everyone is denied access by default. A role called `administrator` is created, which grants access to the `admin portal` resource. Using this structure, only members of the `administrator` role should have access to the `admin portal` resource.

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

// Create some groups for organizing administrative users.
IAM.createGroup('partialadmin', 'admin', 'superadmin')

// Assign the administrator role to the partialadmin group.
IAM.getGroup('partialadmin').assign('administrator')

// Add the partialadmin group to the admin group,
// and add the admin group to the superadmin group.
// This is the equivalent of saying "the partialadmin
// group belongs to the admin group, and the admin group
// belongs to the superadmin group".
IAM.getGroup('admin').addMember('partialadmin')
IAM.getGroup('superadmin').addMember('admin')

// Create a user
let user = new IAM.User()
user.name = 'John Doe' // Optional "nicety" for reporting purposes.

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

```javascript
{
  "display": "superadmin (group) <-- admin (subgroup) <-- partialadmin (subgroup) <-- administrator (role) <-- * (right to view)",
  "description": ""The \"view\" right on the \"admin portal\" resource is granted by the \"admin\" role, which is assigned to the \"subadmin\" group, which is a member of the \"admin\" group, which the user is a member of.\"",
  "governedBy": {
    "group": Group {#oid: Symbol(superadmin group),…},
    "right": Right {#oid: Symbol(allow:* right),…},
    "role": Role {#oid: Symbol(admin role), …}
  },
  "granted": true,
  "resource": Resource {#oid: Symbol(admin portal resource),…},
  "right": "view",
  "stack": (5) [Group, Group, Group, Role, Right],
  "type": "role"
}
```

The `display` and `description` attributes are the most descriptive.

In this case, the user is just part of a group that he probably shouldn't be a member of... so fixing it is a matter of removing the user from the group. The important part of this trace feature is _you didn't have to hunt through an entire application code base to find out which group_.

Here is the actual output from the [basic example](https://github.com/coreybutler/iam/tree/master/examples/basic):

![IAM Example Lineage](https://github.com/coreybutler/iam/raw/master/examples/IAM-lineage.png)

The lineage/trace tool also supports explicitly denied rights (i.e. `deny:xxx`). It will return `null` if there is no lineage.

Lineage is parsed into several additional attributes, purely for ease of use.

The `stack` attribute provides references to the full lineage, including all elements that were responsible for assigning/revoking the specified privileges. This is the same as the `display` attribute, but provides a programmatic trace instead of a descriptive trace.

The `governedBy` attribute provides the highest level group, role, and right. The `granted` attribute determines whether the right was allowed or not. The `resource` attribute is a reference to the system resource, and the `right` attribute is the actual right.

The `type` attribute indicates whether a role the permission was granted/revoked by a "role" or "group" assigned to the user.
