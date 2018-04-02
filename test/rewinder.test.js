const Inventory = require('../src/inventory')
const {BatchSet, Location, Operation} = require('../src/models')

const Rewinder = require('../src/rewinder')

const location = (id, code, parent, batches) => {
  let params = { location_id: id, code, parent }
  if (batches) params.batches = new BatchSet(batches)
  return new Location(params)
}
let operationId = 1
const operation = (from, to, what) => {
  let params = {operation_id: operationId++, source: from, target: to, location: null}
  if (Array.isArray(what)) params.batches = new BatchSet(what)
  else params.location = what
  return new Operation(params)
}

const subtreeLoader = (id) => {
  const inv = new Inventory()
  switch (id) {
    case 1:
      inv.add(location(1, 'A', null))
      inv.add(location(2, 'B', 1, [['shirt', 2]]))
      inv.add(location(3, 'C', 1))
      break
    case 4:
      inv.add(location(4, 'D', null))
      inv.add(location(5, 'E', 4))
      break
    default:
      throw new Error(`TEST: case ${id} is not handled by the subtreeLoader`)
  }
  return inv
}

let dut
beforeEach(() => {
  dut = new Rewinder(subtreeLoader)
})

test('can remove a Location', () => {
  let inv = dut.rewind(1, new Set([
    operation(1, null, 2) // remove 2 forever
  ]))

  expect(inv.keys()).toContain(1)
  expect(inv.keys()).not.toContain(2)
})

test('can move a Location out of subtree', () => {
  let inv = dut.rewind(1, new Set([
    operation(1, 4, 2) // move 2 to an unknown Location
  ]))

  expect(inv.keys()).toContain(1)
  expect(inv.keys()).not.toContain(2)
})

test('can move a Location', () => {
  let inv = dut.rewind(1, new Set([
    operation(1, 3, 2) // move 2 to be a child of 3
  ]))

  expect(inv.keys()).toContain(1)
  expect(inv.keys()).toContain(2)
  expect(inv.tree.from(3)).toContain(2)
})

test('can remove a Batch', () => {
  const dut = new Rewinder(subtreeLoader)
  let inv = dut.rewind(1, new Set([
    operation(2, null, [['shirt', 1]]) // remove a shirt from 2
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(1)
})

test('can move a Batch out of subtree', () => {
  const dut = new Rewinder(subtreeLoader)
  let inv = dut.rewind(1, new Set([
    operation(2, 4, [['shirt', 1]]) // move a shirt from 2 to an unknown Location
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(1)
})

test('can move a Batch', () => {
  const dut = new Rewinder(subtreeLoader)
  let inv = dut.rewind(1, new Set([
    operation(2, 3, [['shirt', 1]]) // move a shirt from 2 to 3
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(1)
  expect(inv.locations.get(3).batches.get('shirt')).toBe(1)
})

test('can move a Location from outside', () => {
  let inv = dut.rewind(1, new Set([
    operation(null, 3, 4) // move 4 to be a child of 3
  ]))

  expect(inv.keys()).toContain(4)
  expect(inv.keys()).toContain(5)
  expect(inv.tree.from(3)).toContain(4)
})