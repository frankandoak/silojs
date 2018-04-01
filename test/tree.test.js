const Tree = require('../tree')
const {Batch, Location, Operation} = require('../models')

const A = new Location('A')
const B = new Location('B')

test('can move a Location inside a Tree', () => {
  const tree = new Tree()
  tree.ensure(A)
  tree.ensure(B)
  tree.exec(new Operation(null, A, [B]))

  expect(tree.childrenMap.get('A')).toContain('B')
})

test('can move a Batch inside a Tree', () => {
  const tree = new Tree()
  tree.ensure(A)
  tree.ensure(B)
  tree.exec(new Operation(A, B, [new Batch('shirt', 2)]))

  expect(A.batches.get('shirt')).toBe(-2)
  expect(B.batches.get('shirt')).toBe(2)
})

test('can reduce a Tree', () => {
  const tree = new Tree()
  tree.ensure(A)
  tree.ensure(B)
  tree.exec(new Operation(null, A, [B]))
  tree.exec(new Operation(A, B, [new Batch('shirt', 2)]))

  expect(tree.reduce(A).get('shirt')).toBe(0)
})

// test('can merge two Trees', () => {
//   const B = new Location('B')
//   const C = new Location('C')
//   const tree = new Tree()

//   tree.exec(new Operation(null, A, [B]))
//   tree.exec(new Operation(null, A, [C]))
//   tree.exec(new Operation(B, C, [new Batch('shirt', 2)]))
//   tree.exec(new Operation(A, C, [new Batch('pants', 2)]))

//   const tree2 = new Tree()

//   // revert ops from tree in fact
//   tree.exec(new Operation(C, B, [new Batch('shirt', 2)]))
//   tree.exec(new Operation(C, A, [new Batch('pants', 2)]))

//   tree.merge(tree2)
// })
