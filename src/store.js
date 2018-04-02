module.exports = class Store extends Map {
  constructor (iterable, key) {
    super(iterable)
    this.key = key
  }

  // Insert only new
  store (model) {
    let id = model[this.key]
    if (!id) { throw new Error(`Cannot find ${this.key} while storing`) }
    if (!this.has(id)) {
      this.set(id, model)
    }
  }
}
