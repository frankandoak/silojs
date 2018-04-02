const {Batch, Operation, Location} = require('./models')
const Inventory = require('./inventory')

/**
 * list all childs of a given location
 * @param {array} ids
 */
const loadChildOf = async (connection, ids) => {
  if (!Array.isArray(ids) || ids.length < 1) { throw new Error('please search a bunch') }
  const sql = {
    sql: `
  SELECT location_id
  FROM silo_location
  WHERE parent IN (?)
  `,
    values: [ids]
  }

  let results = await new Promise((resolve, reject) => {
    connection.query(sql, (error, results, fields) => {
      if (error) reject(error)
      else resolve(results)
    })
  })

  const childs = []
  for (let result of results) {
    if (result.location_id) {
      childs.push(result.location_id)
    }
  }

  return childs.filter(a => !!a)
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
    values: [id | 0],
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
 * @param {object} connection
 * @param {string} until
 */
const loadOperationsUntil = async (connection, until) => {
  let condition = 'AND op.done_at >= ?'
  if (!isNaN(until)) {
    condition = 'AND op.operation_id >= ?'
  }
  const sql = {
    sql: `
  SELECT op.*, sp.*, b.*, sot.*
  FROM silo_operation op
  LEFT JOIN silo_batch b USING (operation_id)
  LEFT JOIN silo_product sp USING (product_id)
  LEFT JOIN silo_operation_type sot ON op.type = sot.operation_type_id
  WHERE done_at IS NOT NULL
  ${condition}
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
const loadSubtree = async (connection, id) => {
  let inv = new Inventory()
  // First find all nodes in the subtree of interest
  let allIds = []
  let ids = [id]
  do {
    allIds = allIds.concat(ids)
    ids = await loadChildOf(connection, ids)
  } while (ids.length > 0) // explore as long as

  // Then for each node fetch its content
  for (let lid of allIds) {
    let location = await loadLocation(connection, lid)
    if (lid === id) {
      location.parent = null
    }
    inv.add(location)
  }

  return inv
}

module.exports = {
  loadChildOf,
  loadLocation,
  loadLocationCode,
  loadOperationsUntil,
  loadSubtree
}
