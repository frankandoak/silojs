const {Batch, BatchSet, Location, Operation} = require('./models')
const LocationMap = Map

module.exports = class LocationTree {
  constructor () {
    this.locations = new LocationMap()
    this.childrenMap = new LocationMap()
  }

  bfsMap (fn, startLocation) {
    const m = this.childrenMap
    const ok = new Set()

    const recurse = (fn, loc) => {
      if (m.has(loc)) {
        if (!ok.has(loc)) {
          fn(this.locations.get(loc))
        }
        const next = []
        m.get(loc).forEach(child => {
          if (!ok.has(child)) {
            fn(this.locations.get(child))
            next.push(child)
            ok.add(child)
          }
        })

        next.forEach(recurse.bind(null, fn))
      }
    }

    recurse(fn, startLocation.name)
  }

  reduce (startLocation) {
    const result = new BatchSet()
    this.bfsMap(loc => {
      result.add(loc.batches)
    }, startLocation)

    return result
  }

  merge (tree) {
    // merge batches first
    // move children where they belong
  }

  /**
   * @param {Operation} op
   */
  exec (op) {
    if (op.from) {
      this.ensure(op.from)
    }
    if (op.to) {
      this.ensure(op.to)
    }

    // This part of the code deal with a Location movement yay
    op.what.forEach(what => {
      switch (true) {
        case (what instanceof Location):
          this.ensure(what)
          const m = this.childrenMap

          // update target and source child list
          if (op.from && m.has(op.from.name)) {
            let fromChildren = m.get(op.from.name)
            let index = fromChildren.indexOf(what.name)
            if (index > -1) {
              fromChildren.splice(index, 1)
            }
          }
          if (op.to) {
            if (m.has(op.to.name)) {
              let toChildren = m.get(op.to.name)
              toChildren.push(what.name)
            } else {
              m.set(op.to.name, [what.name])
            }
          }
          break

        case (what instanceof Batch):
          if (op.to) {
            op.to.add(what)
          }
          if (op.from) {
            op.from.add(what.opposite())
          }
          break

        default:
          throw new Error('dont know what the what is')
      }
    })

    // do something in the tree
  }

  /**
   * @param {Location} loc
   */
  ensure (loc) {
    if (!this.locations.has(loc.name)) {
      this.locations.set(loc.name, loc)
    }
  }
}
