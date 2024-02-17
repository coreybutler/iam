export default class Lineage {
  #path
  #permission

  constructor (solver, permission) {
    const { parent } = permission

    this.#path = [solver]
    this.#permission = permission

    parent !== solver && this.#populate(parent, solver)
    this.#path.unshift(solver.domain)
  }

  get description () {
    const { parent } = this.#permission

    return this.#path.slice(1).reverse().reduce((description, entry, i) => {
      return `${description} ${entry.type} '${entry.name}'${entry === parent ? `, which has permission '${this.#permission.toString()}'.` : `${i === 0 ? ' is assigned' : ', which inherits'}`}`
    }, ``)
  }

  get path () {
    return this.#path
  }

  get permission () {
    return this.#permission
  }

  #populate (target, candidate) {
    if (target === candidate) {
      return this.#path.unshift(candidate)
    }

    const { name } = target

    if (candidate.hasDirectRole(name)) {
      return this.#populate(target, candidate.domain.getRole(name))
    }

    if (!candidate.hasIndirectRole(name)) return

    for (let role of candidate.roles) {
      role = candidate.domain.getRole(role)

      if (role.hasRole(name)) {
        this.#path.unshift(role)
        return this.#populate(target, role)
      }
    }
  }
}