const Tree = require('../src/tree')

const A = {name: 'A'}
const B = {name: 'B'}
const C = {name: 'C'}

test('can link and unlink', () => {
  const tree = new Tree()
  tree.link(A, B)

  expect(tree.from(A).has(B)).toBeTruthy()
  expect(tree.from(A).size).toEqual(1)
  expect(tree.to(B).has(A)).toBeTruthy()
  expect(tree.to(B).size).toEqual(1)

  tree.unlink(A, B)

  expect(tree.from(A).has(B)).toBeFalsy()
  expect(tree.from(A).size).toEqual(0)
  expect(tree.to(B).has(A)).toBeFalsy()
  expect(tree.to(B).size).toEqual(0)
})

test('can bfsMap a Tree', () => {
  const tree = new Tree()
  tree.link(A, B)
  tree.link(A, C)

  const found = new Set()
  tree.bfsMap(f => found.add(f), A)

  expect(found.has(A)).toBeTruthy()
  expect(found.has(B)).toBeTruthy()
  expect(found.has(C)).toBeTruthy()
  expect(found.size).toEqual(3)
})
