export const VERSION = '<#REPLACE_VERSION#>'
export const REGISTRY_ID = Symbol(`IAM Registry ${VERSION}`)

export const hiddenconstant = value => {
  return { enumerable: false, configurable: false, writable: false, value }
}

export function capitalize (word) {
  return word.substring(0, 1).toUpperCase() + word.substring(1)
}

const retrieve = function (type) {
  return (item, throws = false) => {
    const name = item.name !== undefined ? item.name : item.toString()
    const result = globalThis[REGISTRY_ID][type](name)

    if (throws && !result) {
      throw new Error(`The ${type} does not exist: ${name}`)
    }

    return result
  }
}

export const getRole = retrieve('role')
export const getResource = retrieve('resource')
export const getUser = retrieve('user')
export const getGroup = retrieve('group')
