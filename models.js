class Batch {
  constructor (product, quantity = 0) {
    this.product = product
    this.quantity = quantity
  }

  opposite () {
    return new Batch(this.product, -this.quantity)
  }
}

class BatchSet extends Map {
  add (batch) {
    switch (true) {
      case (batch instanceof Batch):
        if (batch.quantity !== 0) {
          const sku = batch.product
          if (this.has(sku)) {
            this.set(sku, this.get(sku) + batch.quantity)
          } else {
            this.set(sku, batch.quantity)
          }
        }
        break
      case (batch instanceof BatchSet):
        batch.forEach((v, k) => {
          this.add(new Batch(k, v))
        })
        break
      default:
        throw new Error('oops')
    }
  }
}

class Location {
  constructor (name, batches) {
    this.name = name
    this.batches = new BatchSet()
  }

  add (batch) {
    this.batches.add(batch)
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
  BatchSet,
  Location,
  Operation
}
