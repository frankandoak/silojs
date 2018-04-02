const Loaders = require('./src/loaders')
const Rewinder = require('./src/rewinder')
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
`)

if (cli.input.length !== 2) {
  cli.showHelp(1)
}

const connection = require('./src/connection')

let main = async () => {
  // Find the starting node
  const startId = await Loaders.loadLocationCode(connection, cli.input[0])
  if (!startId) {
    throw Error(`Cannot find starting Location:${cli.input[0]}`)
  }

  // Load operations to be replayed
  const operations = await Loaders.loadOperationsUntil(connection, cli.input[1])
  console.log(`Loaded ${operations.size} operations`)

  const rewinder = new Rewinder(Loaders.loadSubtree.bind(Loaders, connection))
  const inv = await rewinder.rewind(startId, operations)

  inv.toCsv()
  connection.end()
}

main()
