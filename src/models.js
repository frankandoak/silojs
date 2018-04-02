class Entity {
  constructor (params, def) {
    this._params = params
    this._def = def

    // Assign params to object
    const forbidden = ['_params', '_def']
    for (let key in params) {
      if (key in forbidden) throw new Error(`Forbidden params ${key} on Entity`)
      this[key] = params[key]
    }
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
        for (let [k, v] of batch) {
          this.add(new Batch(k, v))
        }
        break
      default:
        throw new Error('oops')
    }
  }
  remove (batch) {
    switch (true) {
      case (batch instanceof Batch):
        if (batch.quantity !== 0) {
          const sku = batch.product
          if (this.has(sku)) {
            this.set(sku, this.get(sku) - batch.quantity)
          } else {
            this.set(sku, -batch.quantity)
          }
        }
        break
      case (batch instanceof BatchSet):
        for (let [k, v] of batch) {
          this.remove(new Batch(k, v))
        }
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
    if (!this.batches) {
      this.batches = new BatchSet()
    }
  }
}

class Operation extends Entity {
  constructor (params) {
    super(params, {
      identity: 'operation_id'
    })
    if (!this.batches) {
      this.batches = new BatchSet()
    }
  }
  opposite () {
    let params = Object.assign({}, this._params)
    params.source = this._params.target
    params.target = this._params.source
    params.batches = this.batches
    return new Operation(params)
  }
}

module.exports = {
  Batch,
  BatchSet,
  Location,
  Operation
}
