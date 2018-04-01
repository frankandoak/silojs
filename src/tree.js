/**
 * Implement a directed Tree
 * @see https://github.com/timoxley/graphs for inspiration
 */
module.exports = class Tree {
  constructor () {
    this.edgeMaps = new Map()
  }

  // Do not duplicate links
  link (from, to) {
    const e = this._edgeMap(from)
    if (!e.has(to)) {
      this._edgeMap(from).add(to)
    }
    return this
  }

  unlink (from, to) {
    const e = this._edgeMap(from)
    if (e.has(to)) {
      e.delete(to)
      if (!e.size) this.edgeMaps.delete(from)
    }
    return this
  }

  from (from) {
    return new Set(this._edgeMap(from))
  }

  to (to) {
    const linked = new Set()
    this.edgeMaps.forEach(function (value, key) {
      if (value.has(to)) linked.add(key)
    })
    return linked
  }

  _edgeMap (from) {
    let edgeMap = this.edgeMaps.get(from)
    if (!edgeMap) {
      edgeMap = new Set()
      this.edgeMaps.set(from, edgeMap)
    }
    return edgeMap
  }

  bfsMap (fn, node) {
    const m = this.edgeMaps
    const ok = new Set()

    const recurse = (fn, n) => {
      if (m.has(n)) {
        if (!ok.has(n)) {
          fn(n)
        }
        const next = []
        m.get(n).forEach(nb => {
          if (!ok.has(nb)) {
            fn(nb)
            next.push(nb)
            ok.add(nb)
          }
        })

        next.forEach(recurse.bind(null, fn))
      }
    }

    recurse(fn, node)
  }
}