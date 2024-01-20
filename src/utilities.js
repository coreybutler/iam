import { inspect } from 'util'

export function printJSON (json, pretty = true) {
  console.log(inspect(pretty ? JSON.parse(json, null, 2) : json, { depth: null }))
}