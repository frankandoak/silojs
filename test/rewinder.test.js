const Inventory = require('../src/inventory')
const {BatchSet, Location, Operation} = require('../src/models')

const Rewinder = require('../src/rewinder')

const location = (id, code, parent, batches) => {
  let params = { location_id: id, code, parent }
  if (batches) params.batches = new BatchSet(batches)
  return new Location(params)
}
let operationIdC = 30
const operation = (from, to, what, type = null, operationId) => {
  // operationId-- cause we fetch them reverse chronologically
  if (!operationId) operationId = operationIdC--
  let params = {operation_id: operationId, source: from, target: to, location: null, type}
  if (Array.isArray(what)) {params.batches = new BatchSet(what)}
  else {params.location = what}
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

test('can remove a Location', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(1, null, 2) // remove 2 forever
  ]))

  expect(inv.keys()).toContain(1)
  expect(inv.keys()).not.toContain(2)
})

test('can move a Location out of subtree', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(1, 4, 2) // move 2 to an unknown Location
  ]))

  expect(inv.keys()).toContain(1)
  expect(inv.keys()).not.toContain(2)
})

test('can move a Location', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(1, 3, 2) // move 2 to be a child of 3
  ]))

  expect(inv.keys()).toContain(1)
  expect(inv.keys()).toContain(2)
  expect(inv.tree.from(3)).toContain(2)
})

test('can remove a Location along with its subtree', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(1, 3, 2),
    operation(1, null, 3) // remove 3 forever
  ]))

  expect(inv.keys()).toContain(1)
  expect(inv.keys()).not.toContain(2)
  expect(inv.keys()).not.toContain(3)
})

test('can remove a Batch', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(2, null, [['shirt', 1]]) // remove a shirt from 2
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(1)
})

test('can move a Batch out of subtree', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(2, 4, [['shirt', 1]]) // move a shirt from 2 to an unknown Location
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(1)
})

test('can move a Batch', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(2, 3, [['shirt', 1]]) // move a shirt from 2 to 3
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(1)
  expect(inv.locations.get(3).batches.get('shirt')).toBe(1)
})

test('can move a Location from outside', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(null, 3, 4) // move 4 to be a child of 3
  ]))

  expect(inv.keys()).toContain(4)
  expect(inv.keys()).toContain(5)
  expect(inv.tree.from(3)).toContain(4)
})

test('can move a Location from outside with old operations', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(4, null, 5),
    operation(null, 3, 4) // move 4 to be a child of 3
  ]))

  expect(inv.keys()).toContain(4)
  expect(inv.keys()).not.toContain(5)
  expect(inv.tree.from(3)).toContain(4)
})

test('can move a Location from outside with old operations bis', async () => {
  let inv = await dut.rewind(1, new Set([
    operation(4, null, 5),
    operation(null, 3, 4), // move 4 to be a child of 3
    operation(3, 2, 4) // nove 4 to be a child of 2
  ]))

  expect(inv.keys()).toContain(4)
  expect(inv.keys()).not.toContain(5)
  expect(inv.tree.from(3)).not.toContain(4)
  expect(inv.tree.from(2)).toContain(4)
})

test('can exclude a Batch Operation by type', async () => {
  dut = new Rewinder(subtreeLoader, ['bomb'])
  let inv = await dut.rewind(1, new Set([
    operation(2, 3, [['shirt', 1]], 'bomb') // move a shirt from 2 to 3
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(2)
  expect(inv.locations.get(3).batches.get('shirt')).toBeFalsy()
})

test('cannot exclude a Location move by type', async () => {
  dut = new Rewinder(subtreeLoader, ['bomb'])
  expect(dut.rewind(1, new Set([
    operation(1, 3, 2, 'bomb') // move 2 to be a child of 3
  ]))).rejects.toThrowError()
})

test('can exclude a Batch Operation by id', async () => {
  dut = new Rewinder(subtreeLoader, [], [32])
  let inv = await dut.rewind(1, new Set([
    operation(2, 3, [['shirt', 1]], '', 32) // move a shirt from 2 to 3
  ]))

  expect(inv.locations.get(2).batches.get('shirt')).toBe(2)
  expect(inv.locations.get(3).batches.get('shirt')).toBeFalsy()
})