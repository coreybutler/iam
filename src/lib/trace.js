import Base from './base.js'
import Lineage from './lineage.js'

const track = (self, data, role, permission) => {
  data.role = role
  data[permission.denied ? 'deny' : 'grant'](permission.forced)
  data.stack = self.type === 'group' ? [self, role, permission] : [role, permission]

  if (self.type === 'group') {
    data.group = self
  }

  return data
}

export default class Trace extends Base {
  /**
   * Trace the lineage of a right/permission, back to the source.
   * This is useful for answering questions like "what group
   * granted or denied a particular permission?"
   * @param  {string|Resource} resource
   * Resource name.
   * @param  {string|Right} right
   * Permission/right.
   * @return {Lineage}
   */
  trace (resource, right, roles, membership) {
    let data = new Lineage(...arguments)

    // Identify rights by role for the specified resource
    const groupResourceRoles = roles.items.filter(role => role.appliesToResource(resource))
    for (const role of groupResourceRoles) {
      for (const permission of role.rights[resource].filter(r => r.is(right))) {
        if (permission.forced || permission.denied) {
          if (permission.granted) {
            return track(this, data, role, permission)
          }

          data = track(this, data, role, permission)
        } else if (data.role === undefined) {
          data = track(this, data, role, permission)
        }
      }
    }

    // Identify rights by resource role, from subgroup membership
    for (const group of membership) {
      const lineage = group.trace(...arguments)

      if (lineage && (data.role === undefined || lineage.forced || !data.granted)) {
        data.stack = [...[this], ...lineage.stack]//, ...data.stack]
        data.role = lineage.role
        data.group = this

        if (lineage.forced) {
          data.grant(true)
          return data
        }

        if (data.granted !== lineage.granted) {
          if (lineage.granted) {
            data.grant()
          } else {
            data.deny()
          }
        }
      }
    }

    return data
  }
}
