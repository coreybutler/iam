import EventEmitter from './EventEmitter.js'

export default class Component extends EventEmitter {
  #domain
  #parent
  #type
  // #timer
  // #ttl = null

  constructor ({ type, domain, parent,/* ttl,*/ internalEvents }) {
    super(internalEvents)
    this.#domain = domain
    this.#parent = parent
    this.#type = type
    // ttl && (this.TTL = ttl)
  }

  get domain () {
    return this.#domain
  }

  get parent () {
    return this.#parent
  }

  get type () {
    return this.#type
  }

  // /**
  //  * @getter ttl
  //  * @alias of this.TTL
  //  */
  // get ttl () {
  //   return this.#ttl
  // }

  // get TTL () {
  //   return this.#ttl
  // }

  // /**
  //  * @setter ttl
  //  * @alias of this.TTL
  //  */
  // set ttl (val) {
  //   this.#setTTL(val)
  // }

  // set TTL (val) {
  //   this.#setTTL(val)
  // }

  // destroy () {
  //   console.log('DESTROY', this)
  //   // Fire destroy event
  // }

  // #setTimer (ttl) {
  //   this.#timer = setTimeout(() => {
  //     let renewal

  //     this.emit('ttl.expire', {
  //       renew: ttl => renewal = ttl
  //     })

  //     renewal ? this.TTL = renewal : this.destroy()
  //   }, ttl)
  // }

  // #setTTL (val) {
  //   if (val instanceof Date) val = val.getTime() - Date.now()

  //   const previous = this.#ttl

  //   if (isNaN(val) || val <= 0) {
  //     clearTimeout(this.#timer)
  //     this.#ttl = null
  //   } else {
  //     this.#setTimer(val)
  //     this.#ttl = val
  //   }

  //   this.emit('ttl.change', { previous, current: this.#ttl })
  // }
}