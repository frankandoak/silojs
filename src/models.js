class Entity {
  constructor (params, def) {
    this.params = params
    this.def = def
  }

  // clean Refs
}

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

class Location extends Entity {
  constructor (params) {
    super(params, {
      identity: 'location_id'
    })
    this.batches = new BatchSet()
  }
  add (batch) {
    this.batches.add(batch)
  }
}

class Operation extends Entity {
  constructor (params) {
    super(params, {
      identity: 'operation_id',
      relations: ['source', 'target', 'location']
    })
  }
}

class Product extends Entity {
  constructor (params) {
    super(params, {
      identity: 'product_id'
    })
  }
}

module.exports = {
  Batch,
  BatchSet,
  Location,
  Operation,
  Product
}
