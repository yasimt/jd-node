const mysql = require("mysql");
const moment = require("moment");
const fs = require("fs");
const util = require("util");
const errorInfo = require(__basedir + "/app/utility/errorinfo");
var dbcon = {
  connection: function(options, query) {
    return new Promise(function(resolve, reject) {
      let {host, user, password, port, database} = options;
      let conn = mysql.createConnection({
        host: host,
        user: user,
        password: password,
        port: port,
        database: database,
        dateStrings: true
      });
      conn.connect();
      conn.query(query, (err, result) => (err ? reject(err) : resolve(result)));
      conn.end();
    });
  },
  db_query: function(params) {
    var thisObj = this;
    return new Promise(function(resolve, reject) {
      let conn = params.conn;
      let query = params.query;
      if (params.debug) {
        console.log(query);
      }
      const queryres = thisObj
        .connection(conn, query)
        .then(response => {
          resolve(JSON.parse(JSON.stringify(response)));
        })
        .catch(err => {
          let logpath = __basedir + "/logs/sql/";
          let err_obj = {
            time: moment().format("YYYY-MM-DD H:mm:ss"),
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            fatal: err.fatal
          };
          let filename = moment().format("YYYY-MM-DD") + ".log";
          let log_file = fs.createWriteStream(logpath + filename, {
            flags: "a",
            encoding: "utf-8",
            mode: "0666"
          });
          let msg = errorInfo(err);
          log_file.write(
            util.format({
              error: err_obj,
              msg: msg,
              options: params.conn,
              query: params.query
            }) + "\n\n"
          );
          reject(msg);
        });
    });
  }
};
module.exports = dbcon;
