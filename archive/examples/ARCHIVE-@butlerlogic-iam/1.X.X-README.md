
Tell other developer network about IAM with a [tweet](https://twitter.com/intent/tweet?hashtags=javascript&original_referer=http%3A%2F%2F127.0.0.1%3A91%2F&text=Check%20out%20IAM%20for%20securing%20websites%20and%20APIs&tw_p=tweetbutton&url=http%3A%2F%2Fgithub.com%2Fcoreybutler%2Fiam&via=goldglovecb). 

# IAM (Identification and Authorization Management)

IAM is an access control framework for the browser and Node.js. It is lightweight, built on standards, and incredibly powerful.

The library manages roles and permissions, allowing developers to create simple or complex authorization patterns. The **main benefit** is the _ridiculously lightweight_ **query engine**, which primarily answers one question: 

_"Does the user have the right to do something with the system resource?"_

```javascript
if (user.authorized('system resource', 'view')) {
  display()
} else {
  throw new Error('Access Denied')
}
```

**How it works:**

IAM keeps track of resources, rights, roles, and groups. By maintaining the permission structure within the library (internally), it is capable of automatically deriving user rights, even in complex schemas. It's like a permissions calculator.

The library is designed under the guiding principle that **determining whether a user is authorized to view/use a specific feature of an application should always be a binary operation.**

## Shortcuts

- [Examples](#abstracting-complexity)
- [How to Design an Access Control System](#designing-an-access-control-system)
- [Installation](#installation)
- [API Docs](#api-usage)
- [Tracing Permission Lineage](#tracing-permission-lineage) (another awesome query engine feature)
- [Basic Philosophy](https://github.com/coreybutler/iam/wiki)

<table cellpadding="0" cellspacing="10">
  <tr>
    <td>
<a href="https://youtu.be/aUNfi4n5lTM?t=1392" alt="IAM on YouTube" target="_blank"><img src="https://smallimg.pngkey.com/png/small/13-138700_youtube-logo-png-transparent-background-youtube-live-logo.png" height="50px;"/></a>
    </td>
    <td><a href="https://github.com/coreybutler" target="_blank">Corey Butler</a> (original author) gave a recorded introduction to IAM, available <a href="https://youtu.be/aUNfi4n5lTM?t=1392" target="blank">here</a>. The companion slides are available at <a href="https://edgeatx.org/slides/adhoc/iam" target="_blank">edgeatx.org/slides</a>.
    </td>
  </tr>
</table>

## Abstracting complexity

Problems with authorization are typically caused by conditional logic that is too complicated.

Consider the following "authorization" question:

> "Is the user allowed to use this feature, or are they part of a group that can access this feature, or have they been explicitly denied access to a feature, or are they part of a group that's part of another group that has permission, or are any permission overrides to account for?"

Just like proper sentences, **code shouldn't have "run on" logic**. Being a mental gymnast should not be a prerequisite to understand whether someone can access a system component or not. IAM abstracts this complexity.

### Example Browser UI

The code for this is available in the [basic example](https://github.com/coreybutler/iam/tree/master/examples/basic).

![IAM Example UI](https://github.com/coreybutler/iam/raw/master/examples/basic/IAM.png)


### Example Node API

The code for this is available in the [api example](https://github.com/coreybutler/iam/tree/master/examples/api).

In this example, `requireAuthorization` is Express middleware that maps to IAM's `user.authorize()` method.

![IAM Example API](https://github.com/coreybutler/iam/raw/master/examples/api/api_example.png)

---

## Designing an Access Control System

The following guide breaks down the basic terminology of an access control system (as it pertains to IAM).

<table cellpadding="0" cellspacing="10">
  <tr>
    <td style="font-weight: bold; vertical-align:top;">Resources</td>
    <td>
        The names associated with a system component, such as <code>admin portal</code>, <code>user settings</code>, or an any other part of a system where access should be controlled.
    </td>
  </tr>
  <tr>
    <td style="font-weight: bold; vertical-align:top;">Rights</td>
    <td>
        Rights are defined for each resource.<br/>For example, the <code>admin portal</code> resource may have <code>view</code> and <code>manage</code> rights associated with it. Users who are granted <code>view</code> rights should be able to see the <code>admin portal</code>, while users with <code>manage</code> rights can do something in the admin portal. Users without either of these rights shouldn't see the admin portal at all.
    </td>
  </tr>
  <tr>
    <td style="font-weight: bold; vertical-align:top;">Users</td>
    <td>System users</td>
  </tr>
  <tr>
    <td style="font-weight: bold; vertical-align:top;">Roles</td>
    <td>
      A collection of permissions for <i>system features</i>, typically based on how the festures are used together.
    </td>
  </tr>
  <tr>
    <td style="font-weight: bold; vertical-align:top;">Groups</td>
    <td>
      A collection of <i>users</i>.
    </td>
  </tr>
</table>

To grant/revoke access, developers create **roles** and assign them to **users** or **groups** of users. A role is assigned the rights of specific resources. Users and groups can then be assigned to these roles.

**Groups** can be assigned users, roles, and even other groups. Groups allow developers to define simple or complex permission hierarchies.

By using each of these major components (resources, rights, roles, users, groups), the permission structure of your applications become significantly easier to manage. In turn, authorizing users becomes a trivial task with the `IAM.User` object. See examples in the usage section below.

---

## Installation

This is available as an importable ES Module (all runtimes), CommonJS (Node.js), and global object (all runtimes).

A guide and high level API documentation are below. **See the source code for additional inline documentation.**

### Installing for Node.js (8.x.x or higher) as an ES Module

Available on npm as [@butlerlogic/node-iam](https://www.npmjs.com/package/@butlerlogic/node-iam). Sourcemaps are available via [@butlerlogic/node-iam-debug](https://www.npmjs.com/package/@butlerlogic/node-iam-debug).

`npm install @butlerlogic/node-iam -S`

```javascript
import IAM from '@butlerlogic/node-iam'
```

_Remember_, to use modules in Node.js, the `type` attribute in `package.json` must be set to `"module"`:

```hcl
{
  "type": "module"
}
```

**For Node versions prior to 13.x.x**, Node must be run with the `--experimental-modules` flag:

`node --experimental-modules index.js`

For more information, read the [ES Module Support Announcement](https://medium.com/@nodejs/announcing-a-new-experimental-modules-1be8d2d6c2ff).

See the [api example](https://github.com/coreybutler/iam/tree/master/examples/api) for a working example.

### Installing for Node.js as a CommonJS Module

Available on npm as [@butlerlogic/node-iam-legacy](https://www.npmjs.com/package/@butlerlogic/node-iam-legacy). Sourcemaps are available via [@butlerlogic/node-iam-legacy-debug](https://www.npmjs.com/package/@butlerlogic/node-iam-legacy-debug).

`npm install @butlerlogic/node-iam-legacy -S`

```javascript
const IAM = require('@butlerlogic/node-iam-legacy')
```

### Installing for the browser

```html
<script type="module">
  import IAM from 'https://cdn.jsdelivr.net/npm/@butlerlogic/browser-iam@1.0.1/iam-1.0.1.min.js'

  let user = new IAM.User('roleA', 'roleB')
</script>
```

See [JSDelivr.com](https://www.jsdelivr.com/package/npm/@butlerlogic/iam) for the latest CDN version.

IAM is also available on Pika:

```html
<script type="module">
  import IAM from 'https://cdn.pika.dev/@butlerlogic/browser-iam@^1.0.1'

  let user = new IAM.User('roleA', 'roleB')
</script>
```
---

# API Usage

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

The `IAM.Group` and `IAM.User` objects both contain a `trace(<resource>, <right>)` method for this. The **resource** needs to be a string/`IAM.Resource`) and the **right** is a string/`IAM.Right`.

In the following example, a system resource called `admin portal` exists, but everyone is denied access by default. A role called `administrator` is created, which grants access to the `admin portal` resource. Using this structure, only members of the `administrator` role should have access to the `admin portal` resource.

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
