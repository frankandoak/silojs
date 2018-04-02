// Init mysql connection
const mysql = require('mysql')

module.exports = (dsn) => {
  console.log(dsn)
  const connection = mysql.createConnection(dsn)
  connection.connect()

  return connection
}
