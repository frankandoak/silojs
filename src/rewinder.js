const l = require('debug')('rewinder')

module.exports = class Rewinder {
  constructor (subtreeLoader) {
    this.subtreeLoader = subtreeLoader
    this.stack = 0
  }

  /**
   * @param {string} id Location to be considered root of the rewindable tree
   * @param {Set} operationSet Operation to replay, in order
   */
  rewind (id, operationSet) {
    let prevStack = this.stack
    let operationSetCopy = new Set(operationSet)
    this.stack = id
    l(`St:${this.stack} with ${operationSet.size} Ops`)
    let inv = this.subtreeLoader(id)

    operationSet.forEach(op => {
      if (op.location) {
        this._moveLocation(inv, op, operationSetCopy)
      } else {
        this._moveBatch(inv, op)
      }
    })
    this.stack = prevStack
    return inv
  }

  /**
   * @param {Inventory} inv
   * @param {Operation} op
   */
  _moveLocation (inv, op, opSet) {
    const sourceId = op.source
    const targetId = op.target
    const whatId = op.location

    // Location movement is a pain to handle, there's many cases depending on if
    // target, source and what are known to the subtree or not
    // It's better to draw for yourself the 8 possibles cases
    const locs = inv.locations
    const tree = inv.tree
    const hasSource = sourceId && locs.has(sourceId)
    const hasTarget = targetId && locs.has(targetId)
    const hasWhat = whatId && locs.has(whatId)
    const id = `St:${this.stack} Operation:${op.operation_id}`

    if (hasSource) {
      if (hasWhat) {
        if (hasTarget) {
          // just move
          tree.unlink(sourceId, whatId)
          tree.link(targetId, whatId)
          l(`${id} moves ${whatId}`)
        } else {
          // move and delete
          tree.unlink(sourceId, whatId)
          locs.delete(whatId)
          l(`${id} deletes ${whatId}`)
        }
      } else {
        throw new Error(`${id} cannot move an unknown Location from a known Source`)
      }
    } else { // no source
      if (hasWhat) {
        throw new Error(`${id} cannot move a known Location from an unknown Source`)
      } else {
        if (hasTarget) {
          // Here's the tricky part my friend. We need to:
          // - Compute the operationSet that runs until current op
          //   (we could do it earlier, but that would be comp heavy)
          // - Fetch the subtree inventory of whatId (which is unknown),
          //   and replay it until the current operation (hence the first step)
          // - Weld the subtree inventory to the current inventory
          // You'll notice that this step makes rewind recursive...
          let newSet = new Set()
          opSet.forEach(newOp => {
            if (newOp.operation_id > op.operation_id) {
              newSet.add(newOp)
            }
          })

          l(`${id} loads subtree for ${whatId}`)
          let newInv = this.rewind(whatId, newSet)
          // Replay the ops on newInv !!!
          inv.weld(newInv, whatId, targetId)
        } else {
          l(`${id} nop`)
        }
      }
    }
  }

  _moveBatch (inv, op) {
    const store = inv.locations
    const sourceId = op.source
    const targetId = op.target
    const id = `St:${this.stack} Operation:${op.operation_id}`
    if (store.has(sourceId)) {
      l(`${id} removes a batch from ${sourceId}`)
      let source = store.get(sourceId).batches
      source.remove(op.batches)
    }
    if (store.has(targetId)) {
      let target = store.get(targetId).batches
      l(`${id} adds a batch to ${targetId}`)
      target.add(op.batches)
    }
  }
}
