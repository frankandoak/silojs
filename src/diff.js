/*

je liste les operations
soit j'update l'arbre, soit j'update le contenu des noeuds
si je supprime/créer des locations, que se pass-t-il ?

au départ d'un noeud:
- je build l'arborescence ACTUEL
- je liste les operations ayant trait aux noeud de l'arborescence actuel et je les replay back un par un... jusqu'a la date

*/

// const Tree = require('./tree')
// const {Batch, Location, Operation} = require('./models')

const mysql = require('mysql')
var connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  database: 'projectx'
})
connection.connect()

const stream = require('stream')

const sql = {
  sql: `
SELECT *
FROM silo_operation o
LEFT JOIN silo_location slf ON slf.location_id = o.source
LEFT JOIN silo_location slt ON slt.location_id = o.target
LEFT JOIN silo_batch b USING (operation_id)
WHERE done_at IS NOT NULL
AND o.location IS NULL
ORDER BY operation_id DESC LIMIT 5
`,
  nestTables: true
}

const EntityManager = require('./em')
const em = new EntityManager()
const {Location, Operation} = require('./models')

const treeWriter = new stream.Writable({
  write: (chunk, encoding, next) => {
    // sets this._write under the hood
    console.log(chunk)
    em.attach(new Operation(chunk.o))
    em.attach(new Location(chunk.slf))
    em.attach(new Location(chunk.slt))

    // An optional error can be passed as the first argument
    next()
  },
  objectMode: true
})

connection.query(sql)
  .stream({highWaterMark: 5})
  .pipe(treeWriter)
  .on('finish', () => {
    console.log(em)
  })

connection.end()
