import { inspect } from 'util'

export const ACCESS_KEY = Symbol()

export function getTrumpingPermission (...permissions) {
  return permissions.reduce((trump, permission) => {
    return trump 
      ? permission.weight > trump?.weight ? permission : trump
      : permission
  }, null)
}

export function list(...entries) {
  return entries.reduce((result, entry, i) => {
    return `${result}${i > 0 ? ', ' : ''}${i === entries.length - 1 ? 'and ' : ''}"${entry}"`
  }, '')
}

export function printJSON (json, pretty = true) {
  console.log(inspect(pretty ? JSON.parse(json, null, 2) : json, { depth: null }))
}

export function throwError (domain, error) {
  throw new Error(`${domain ? `"${domain.name}" Domain: ` : ''}${error}`)
}