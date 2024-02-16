# TODOs

## Trusts

Domains should be able to trust Roles and Users from other Domains.

```js
const domain = new Domain({
  name: 'Trusting Domain',

  trusts: [{
    domain: 'Trustworthy Domain',

    roles: {
      'Administrator': ['Admin']
    }
  }]
})
```

This maps the 'Administrator' Role from 'Trustworthy Domain' onto the 'Admin' Role from 'Trusting Domain'. This will grant Users from 'Trustworthy Domain' who are in the 'Administrator' Role all the same permissions as Users in the 'Admin' Role on 'Trusting Domain'.

## Macros

Macros are functions that allow permissions to be calculated in bulk:

```js
const domain = new Domain({
  name: 'My Domain',

  macros: [{
    name: 'My Macro',

    handler (obj, ...args) {
      const acl = obj.getACL('Resource 1')

      return acl.allows('write') || acl.allowsSome('view', 'manage')
    }
  }]
})
```

The "My Macro" Macro can then be used as such:

```js
const user = domain.getUser('Username')

console.log(user.test('My Macro'))
```

The 'test' method will call the 'handler' associated with 'My Macro', passing in the 'user' object as the first parameter, plus any additional parameters passed into the 'test' method call. It will then return the return value of the 'My Method' handler. This should be a Boolean.

## Resource Requirements

This allows Resources to be made dependent upon other Resources.

```js
const domain = new Domain({
  name: 'My Domain',

  resources: [{
    name: 'My Resource',
    rights: ['read', 'write'],

    requires: {
      'Other Resource': {
        some: ['read', 'write'],
        each: ['view', 'manage']
      }
    }
  }]
})
```

This means any user who wants to be granted rights on 'My Resource' must also have 'view', 'manage' and either 'read' or 'write' access on 'Other Resource'.