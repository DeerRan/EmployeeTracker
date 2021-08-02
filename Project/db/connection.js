const util = require("util");
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  // username
  user: "root",
  // password
  password: "DeerRan",
  database: "employees"
});

connection.connect();

connection.query = util.promisify(connection.query);

module.exports = connection;
