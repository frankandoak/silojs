// Init mysql connection
const mysql = require('mysql')
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  database: 'projectx'
})
connection.connect()

module.exports = connection
