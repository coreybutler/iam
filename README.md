# IAM

A identification and authorization manager for the browser and Node.js.
This library manages roles and permissions, allowing developers to create
simple or complex authorization patterns.

This is available as a commonJS node module, an importable ES Module, or
a global browser namespace.

## General Premise

This library keeps track of resources and rights.

**Resources** are arbitrary names associated with an application, such as `admin portal`, `user settings`, or an any other component of a system where access should be controlled. Developers can also associate **rights** with each of these resources.

  For example, the `admin portal` resource may have `view` and `manage` rights associated with it. Users who are granted `view` rights should be able to see the `admin portal`, while users with `manage` rights can do something in the admin portal. Users without either of these rights shouldn't see the admin portal at all.

To control access, developers create **roles** and assign them to **users**. A role is assigned rights to specific resources. Users can then be assigned to roles.

With all of this setup, authorizing users becomes a trivial task with the `IAM.User` object. See examples below.


## Installation

*Installing for Node.js*

`npm install iam -S`

```
import IAM from 'iam'
// OR
const iam = require('iam')
const iam = new IAM()
```

*Installing for the browser (ES Module)*

```
<script type="module">
  import IAM from 'https://some.cdn.com/iam'

  let user = new IAM.User('roleA', 'roleB')
</script>
```

*Installing for the browser as a global namespace*

```
<script src="https://some.cdn.com/iam"></script>
<script type="text/javascript">
  let user = new IAM.User('roleA', 'roleB')
</script>
```

## Usage (API)

... fill me in ...
