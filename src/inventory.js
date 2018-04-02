const {Location} = require('./models')
const Store = require('./store')
const Tree = require('./tree')

module.exports = class Inventory {
  constructor () {
    // Inventory holds two informations together
    // - the EntityStore, which is reponsible for holding and mapping the Locations
    //   to their location_id
    // - the Tree, which holds all the parent-child relationships, by manipulating
    //   solely location_id references (@todo not sure location_id is necessary)
    this.locations = new Store(null, 'location_id')
    this.tree = new Tree()
  }

  /**
   * Register the location, and place it in the tree if a parent is known
   * @param {Location} location
   */
  add (location) {
    this.locations.store(location)
    if (location.parent) {
      this.tree.link(location.parent, location.location_id)
    }
  }

  has (id) {
    return this.locations.has(id)
  }

  /**
   * @param {int} id of the Location to retrieve
   * @returns {Location}
   */
  retrieve (id) {
    return this.locations.retrieve(id)
  }

  keys () {
    return Array.from(this.locations.keys())
  }

  getByCode (code) {
    for (let value of this.locations.values()) {
      if (value.code === code) {
        return value
      }
    }
    return null
  }

  addBatch (location, batch) {
    const loc = this.locations.retrieve(location.location_id)
    loc.add(batch)
  }

  weld (inv, root, target) {
    for (let [k, v] of inv.locations) {
      if (this.locations.has(k)) {
        throw new Error(`${k} location already exists in the target inventory`)
      }
      this.locations.set(k, v)
    }
    for (let [k, v] of inv.tree) {
      if (this.tree.has(k)) {
        throw new Error(`${k} edgeMap already exists in the target inventory`)
      }
      this.tree.set(k, v)
    }
    this.tree.link(target, root)
  }

  deleteSubtree (sourceId, whatId) {
    this.tree.unlink(sourceId, whatId)
    this.locations.delete(whatId)
    let idToRemove = []
    this.tree.bfsMap(id => {
      idToRemove.push(id)
    }, whatId)
    for (let id of idToRemove) {
      this.locations.delete(id)
      this.tree.delete(id)
    }
  }

  toCsv () {
    for (let location of this.locations.values()) {
      for (let [product, quantity] of location.batches) {
        if (quantity !== 0 && quantity !== null) {
          let dataStr = [
            location.code,
            product,
            quantity
          ].join(',')
          console.log(dataStr)
        }
      }
    }
  }
}
