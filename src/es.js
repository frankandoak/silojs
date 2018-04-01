module.exports = class EntityStore {
  constructor () {
    this.stores = {}
  }

  store (model) {
    let store = this._store(model)
    let id = model.def.identity
    if (!id) { throw new Error('definition should hold identity field') }
    if (model.params[id] && !store.has(model.params[id])) {
      // Insert only new
      store.set(model.params[id], model)
    }
  }

  retrieve (model, id) {
    return this._store(model).get(id)
  }

  /**
   *
   * @param {*} model
   * @returns {Map}
   */
  _store (model) {
    let name = model.name || model.constructor.name
    if (!this.stores[name]) {
      this.stores[name] = new Map()
    }
    return this.stores[name]
  }
}
