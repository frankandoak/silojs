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

const meow = require('meow')
const log = require('debug')('rewind')
const cli = meow(`
    Usage
      $ node rewind.js <locationCode> <pastTime>

    Options
      --dsn         (TODO) Database Source Name
      --merge       (TODO) Merge all batches to locationCode

    Examples
      $ node rewind.js MTLST
      ...
`, {
  flags: {
    rainbow: {
      type: 'boolean',
      alias: 'r'
    }
  }
})

if (cli.input.length < 1) {
  cli.showHelp(1)
}

const mysql = require('mysql')
const stream = require('stream')
const {Batch, Location, Operation, Product} = require('./src/models')
const startLocationCode = cli.input[0]
const Inventory = require('./src/inventory')
const inv = new Inventory()

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  database: 'projectx'
})
connection.connect()

const pipeQuery = (query, writer) => new Promise((resolve, reject) => {
  connection.query(query)
    .stream({highWaterMark: 5})
    .pipe(writer)
    .on('finish', () => {
      resolve()
    })
    .on('error', err => {
      reject(err)
    })
})

/**
 * load a given Location into the inventory instance
 * @param {string} code
 */
const loadLocation = async (code) => {
  const sql = {
    sql: `
  SELECT l.*, b.*, p.*
  FROM silo_location l
  LEFT JOIN silo_batch b USING (location_id)
  LEFT JOIN silo_product p USING (product_id)
  WHERE l.code = ?
  `,
    values: [code],
    nestTables: true
  }

  const treeWriter = new stream.Writable({
    write: (chunk, encoding, next) => {
      const loc = new Location(chunk.l)
      inv.add(loc)
      inv.addBatch(loc, new Batch(chunk.p.sku, chunk.b.quantity))

      // An optional error can be passed as the first argument
      next()
    },
    objectMode: true
  })

  await pipeQuery(sql, treeWriter)
}

/**
 * list all childs of a given location
 * @param {array} codes
 */
const loadChildOf = async (code) => {
  if (code.length < 1) { throw new Error('please search a bunch') }
  const sql = {
    sql: `
  SELECT loc.code
  FROM silo_location parent
  LEFT JOIN silo_location loc ON parent.location_id = loc.parent
  WHERE parent.code IN (?)
  `,
    values: [code]
  }

  const childs = []

  const treeWriter = new stream.Writable({
    write: (chunk, encoding, next) => {
      childs.push(chunk.code)
      next()
    },
    objectMode: true
  })

  await pipeQuery(sql, treeWriter)

  return childs.filter(a => !!a)
}

(async () => {
  // First find all nodes in the subtree of interest
  let allCodes = []
  let codes = [startLocationCode]
  do {
    allCodes = allCodes.concat(codes)
    codes = await loadChildOf(codes)
    log('found ' + codes.length)
  } while (codes.length > 0) // explore as long as

  // Then for each nodem fetch its content
  for (let code of allCodes) {
    await loadLocation(code)
  }

  log(inv)
  inv.toCsv()
  connection.end()
}
)()
