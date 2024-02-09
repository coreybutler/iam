export default class Lineage extends Array {
  #permission
  #solver
  
  constructor (solver, permission, path = []) {
    super(...path)
    this.#permission = permission
    this.#solver = solver
  }

  // TODO: Add i18n support
  get description () {
    if (this.length === 0) {
      const { type, name } = this.#solver,
            { allows, resource, right } = this.#permission

      return `${type} '${name}' is directly ${allows ? 'allowed' : 'denied'} Right '${right}' on Resource '${resource}' via Permission '${this.#permission.toString()}'.`
    }

    return 'ROLE BUD'
  }
}

// function getEntry ({ name, type }, permission) {
//   // const entry = { name, type }

//   // if (!permission) {
//   //   return entry
//   // }

//   // const { allows, resource, right, type } = permission

//   // return {
//   //   name: permission.toString(),

//   //   parent: {
//   //     name: parent.name,
//   //     type: parent.type
//   //   },

//   //   resource,
//   //   right,
//   //   type,
//   //   allows
//   // }
// }

// export default class Lineage extends Array {
//   #permission
//   #solver

//   constructor (solver, permission) {
//     super()
//     this.#permission = permission
//     this.#solver = solver
//     permission.parent !== solver && this.#populate(solver)
//   }

//   // Think about localization
//   get description () {
//     if (this.length === 0) {
//       const { type, name } = this.#solver,
//             { allows, resource, right } = this.#permission

//       return `${type} '${name}' is directly ${allows ? 'allowed' : 'denied'} Right '${right}' on Resource '${resource}'.`
//     }

//     return 'ROLE BUD'
//   }

//   // Admin Role -> Basic User -> 

//   get permission () {
//     return this.#permission
//   }

//   #populate (solver) {
//     const { parent } = this.#permission

//     for (let role of solver.roles) {
//       role = solver.domain.getRole(role)
      
//       if (role === parent) {
//         this.unshift(role.data)
//         break
//       }


//     }


//     // const { parent } = this.#permission

//     // if (entity === parent) {
//     //   console.log(`${entity.type} "${entity.name}" MATCHES "${parent.name}". PUSH TO LINEAGE`)
//     //   return this.unshift(entity.data)
//     // }

//     // const lineage = []

//     // for (let role of entity.roles) {
//     //   role = entity.domain.getRole(role)

//     //   if (role.)
//     // }

//     // console.log(`${entity.type} "${entity.name}" DOES NOT MATCH "${parent.name}". CHECK ROLES`)

//     // if (entity.hasDirectRole(parent.name)) {
//     //   console.log(`${entity.type} "${entity.name}" IS DIRECTLY ASSIGNED "${parent.name}". PUSH TO LINEAGE.`)
//     //   return this.unshift(parent.data)
//     // }

//     // console.log(`${entity.type} "${entity.name}" IS NOT DIRECTLY ASSIGNED "${parent.name}". CHECK PARENTS.`)

//     // console.log(entity.roles)

//     // if (entity.hasInheritedRole(parent.name)) {
//     //   console.log(`${entity.type} "${entity.name}" HAS ANCESTOR WHICH ASSIGNS "${parent.name}". PUSH TO LINEAGE`)
//     //   this.unshift(parent.data)
//     //   return console.log(parent.parent)
//     // }

//     // console.log(`${entity.type} "${entity.name}" DOES NOT INHERIT "${parent.name}".`)


//     // if (entity === parent) return this.unshift(entity.data)
    
//     // if (entity.hasRole(name)) {
//     //   const role = entity.domain.getRole(name)
//     //   this.unshift(role.data)
//     //   console.log(role === parent);
//     // }

//     // if (role === parent) return this.unshift(role.data)

//     // console.log('YO');
//     // console.log(role.data)
//     // console.log(parent.data);
//     // // this.unshift(role.data)
//     // this.#populate(role)
//   }

//   // get description () {
//   //   const entity = `${this.#parent.type} "${this.#parent.name}"`,
//   //         permission = this.#path.at(-1),
//   //         { allows, parent, resource, right } = permission ?? {},
//   //         action = `${allows ? 'granted' : 'denied'} the "${right}" Right on the "${resource}" Resource`,
//   //         application = `the Permission "${permission.toString()}"`

//   //   if (!permission) return `${entity} does not have "${right}" permission on the "${resource}" Resource.`
//   //   if (parent === this) return `${entity} is directly ${action} via ${application}`

//   //   return `${entity} is ${action} via the Role "${parent.name}", which applies ${application}`
//   // }

//   // #getPath (final) {
//   //   this.#path = [final]

//   //   console.log(final.parent)
//   // }
// }