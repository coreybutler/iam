export const ACCESS_KEY = Symbol()

export const ROLE_WEIGHTS = Object.freeze({
  'allow': 1,
  'priority allow': 4,
  'high priority allow': 8,
  'deny': 2,
  'priority deny': 3,
  'high priority deny': 7
})

export const USER_WEIGHTS = Object.freeze({
  'deny': 5,
  'allow': 6,
  'always allow': 10,
  'always deny': 9
})