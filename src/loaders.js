const {Batch, Operation, Location} = require('./models')

/**
 * load a given Location into the inventory instance
 * @param {string} code
 */
const loadLocationCode = async (connection, code) => {
  const sql = {
    sql: `
  SELECT l.location_id
  FROM silo_location l
  WHERE l.code = ?
  `,
    values: [code]
  }

  let id = await new Promise((resolve, reject) => {
    connection.query(sql, (error, results, fields) => {
      if (error) reject(error)
      if (results.length === 1 && results[0].location_id) {
        resolve(results[0].location_id)
      }
      reject(new Error('not found'))
    })
  })

  return id
}

/**
 *
 * @param {*} connection
 * @param {*} id
 * @returns {Location}
 */
const loadLocation = async (connection, id) => {
  const sql = {
    sql: `
  SELECT l.*, b.*, p.*
  FROM silo_location l
  LEFT JOIN silo_batch b USING (location_id)
  LEFT JOIN silo_product p USING (product_id)
  WHERE l.location_id = ?
  `,
    values: [id],
    nestTables: true
  }

  let results = await new Promise((resolve, reject) => {
    connection.query(sql, (error, results, fields) => {
      if (error) reject(error)
      else resolve(results)
    })
  })

  let location = null
  for (let result of results) {
    if (!location) {
      location = new Location(result.l)
    }
    if (result.b.batch_id && result.b.quantity !== 0) {
      location.batches.add(new Batch(result.p.sku, result.b.quantity))
    }
  }

  return location
}

/**
 * list all childs of a given location
 * @param {array} codes
 */
const loadChildOf = async (pipeQuery, code) => {
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

  const treeWriter = (chunk, encoding, next) => {
    childs.push(chunk.code)
    next()
  }

  await pipeQuery(sql, treeWriter)

  return childs.filter(a => !!a)
}

/**
 * @param {object} connection
 * @param {string} until
 */
const loadOperationsUntil = async (connection, until) => {
  const sql = {
    sql: `
  SELECT op.*, sp.*, b.*, sot.*
  FROM silo_operation op
  LEFT JOIN silo_batch b USING (operation_id)
  LEFT JOIN silo_product sp USING (product_id)
  LEFT JOIN silo_operation_type sot ON op.type = sot.operation_type_id
  WHERE done_at IS NOT NULL
  AND op.done_at >= ?
  ORDER BY done_at DESC
  `,
    values: [until],
    nestTables: true
  }

  let results = await new Promise((resolve, reject) => {
    connection.query(sql, (error, results, fields) => {
      if (error) reject(error)
      else resolve(results)
    })
  })

  const operations = new Map()
  for (let result of results) {
    // Add the operation if not existing
    let opId = result.op.operation_id
    let typeName = result.sot.name
    let op = null
    if (!operations.has(opId)) {
      op = new Operation(Object.assign(result.op, {type: typeName}))
      operations.set(opId, op)
    } else {
      op = operations.get(opId)
    }
    // Add the batch if there's one
    if (result.b.batch_id && result.b.quantity !== 0) {
      op.batches.add(new Batch(result.sp.sku, result.b.quantity))
    }
  }

  return new Set(operations.values())
}

/**
 * @returns {Inventory} loaded subtree
 */
const loadSubtree = () => {
  // First find all nodes in the subtree of interest
  // let allCodes = []
  // let codes = [startLocationCode]
  // do {
  //   allCodes = allCodes.concat(codes)
  //   codes = await loadChildOf(pipeQuery, codes)
  //   log('found ' + codes.length)
  // } while (codes.length > 0) // explore as long as

  // // Then for each nodem fetch its content
  // for (let code of allCodes) {
  //   await loadLocation(pipeQuery, inv, code)
  // }
}

module.exports = {
  loadLocation,
  loadChildOf,
  loadLocationCode,
  loadOperationsUntil
}
