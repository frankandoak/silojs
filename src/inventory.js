const {Batch, Location, Operation, Product} = require('./models')
const EntityStore = require('./es')
const Tree = require('./tree')

module.exports = class Inventory {
  constructor () {
    this.es = new EntityStore()
    this.tree = new Tree()
  }

  // auto register the parent if any
  add (location) {
    this.es.store(location)
    this.tree.link(location.params.parent, location.params.location_id)
  }

  get (id) {
    return this.es.retrieve(Location, id)
  }

  getByCode (code) {
    let store = this.es._store(Location)
    for (let value of store.values()) {
      if (value.params.code === code) {
        return value
      }
    }
    return null
  }

  addBatch (location, batch) {
    const loc = this.es.retrieve(Location, location.params.location_id)
    loc.add(batch)
  }

  toCsv () {
    for (let location of this.es._store(Location).values()) {
      for (let [product, quantity] of location.batches) {
        if (quantity !== 0 && quantity !== null) {
          let dataStr = [
            location.params.code,
            product,
            quantity
          ].join(',')
          console.log(dataStr)
        }
      }
    }
  }
}
