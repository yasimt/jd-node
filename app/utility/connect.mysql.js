const mysql = require('mysql');
class Database {
    constructor(config) {
	config.dateStrings= true;
        this.connection = mysql.createConnection(config);
    }
    query(sql, args) {
        return new Promise((resolve, reject) => {
            this.connection.query(sql, args, (err, rows,fields) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
                this.close();
            });
        });
    }
    close() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
}
module.exports  =   Database;
