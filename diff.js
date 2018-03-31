/*

je liste les operations
soit j'update l'arbre, soit j'update le contenu des noeuds
si je supprime/créer des locations, que se pass-t-il ?
*/

const Tree = require('./tree')
const {Batch, Location, Operation} = require('./models')

const A = new Location('A')
const B = new Location('B')
const C = new Location('C')
const tree = new Tree()

tree.exec(new Operation(null, A, [B]))
tree.exec(new Operation(null, A, [C]))
tree.exec(new Operation(B, C, [new Batch('shirt', 2)]))
tree.exec(new Operation(A, C, [new Batch('pants', 2)]))

console.log(tree)
