/**
 * Implement a directed Tree
 * @see https://github.com/timoxley/graphs for inspiration
 */
module.exports = class Tree extends Map {
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
      if (!e.size) this.delete(from)
    } else {
      throw new Error('already removed')
    }
    return this
  }

  from (from) {
    return new Set(this._edgeMap(from))
  }

  to (to) {
    const linked = new Set()
    for (let [key, value] of this) {
      if (value.has(to)) linked.add(key)
    }
    return linked
  }

  _edgeMap (from) {
    let edgeMap = this.get(from)
    if (!edgeMap) {
      edgeMap = new Set()
      this.set(from, edgeMap)
    }
    return edgeMap
  }

  bfsMap (fn, node) {
    const m = this
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
