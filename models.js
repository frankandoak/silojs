class Batch {
  constructor (product, quantity = 0) {
    this.product = product
    this.quantity = quantity
  }

  opposite () {
    return new Batch(this.product, -this.quantity)
  }
}

class Location {
  constructor (name, batches) {
    this.name = name
    this.batches = new Map()
  }

  add (batch) {
    if (batch.quantity !== 0) {
      const b = this.batches
      const sku = batch.product
      if (b.has(sku)) {
        b.set(sku, b.get(sku) + batch.quantity)
      } else {
        b.set(sku, batch.quantity)
      }
    }
    console.log(this)
  }
}

class Operation {
  constructor (from, to, what) {
    this.from = from
    this.to = to
    this.what = what
  }
}

module.exports = {
  Batch,
  Location,
  Operation
}
