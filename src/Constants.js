export const ACCESS_KEY = Symbol()

export const ROLE_WEIGHTS = Object.freeze({
  'allow': 1,
  'deny': 2,
  'priority allow': 3,
  'priority deny': 4,
  'override deny': 7,
  'override allow': 8
})

export const USER_WEIGHTS = Object.freeze({
  'deny': 5,
  'allow': 6,
  'force deny': 9,
  'force allow': 10
})


// ROLE               allow    1
// ROLE               deny     2
// ROLE      priority allow    3
// ROLE      priority deny     4
// USER               deny     5
// USER               allow    6
// ROLE      override allow    7
// ROLE      override deny     8
// USER         force deny     9
// USER         force allow   10