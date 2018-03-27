const l = console.log
const is = (expected, object) => {
  return object
}
const isInt = a => a

class Product {
  constructor (sku) {
    this.sku = sku
  }
}

class Batch {
  constructor (p, q = 0) {
    this.p = is(Product, p)
    this.q = isInt(q)
  }
  add (b) {
    return new Batch(this.p, this.q + b.q)
  }
}

class Location {
  constructor (n) {
    this.n = n
    this.batch = null
  }
  unsafeSet (b) {
    this.batch = b
  }
}

let p = new Product('aha')
let b = new Batch(p, 2)

let b2 = new Batch(p, 5)
let lo = new Location('root')
lo.unsafeSet(b2)
l(lo)
