/*
Rewinding Operations on a Silo Inventory subtree involves the following steps:
- Rebuild the current tree structure
- Replay operations until it reaches the selected date. We only take into account
the operations that changes the tree or its node content.
There's however some caveats when you play only with subtrees... TBC
*/
const meow = require('meow')
const cli = meow(`
    Usage
      $ node rewind.js <locationCode> <pastTime>

      locationCode  Code of the Location to use as root
      pastTime      String as understood by SQL

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
const {loadLocation, loadChildOf, loadOperationsUntil, loadLocationCode} = require('./src/loaders')
const startLocationCode = cli.input[0]
const until = cli.input[1]
const Inventory = require('./src/inventory')
const inv = new Inventory()

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  database: 'projectx'
})
connection.connect()
//
;(async () => {
  // Load operations to be replayed
  // Init a rewinder with the subtreeloader
  // Make it rewind the operation..., calling the subtree loader when needed
  // let arf = await loadOperationsUntil(connection, until)
  let arf = await loadLocationCode(connection, startLocationCode)
  console.log(arf)
  // log(inv)
  inv.toCsv()
  connection.end()
}
)()
