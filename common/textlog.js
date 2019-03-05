const fs = require("fs");
const util = require("util");
const moment = require("moment");
module.exports = function textLog(src, parentid = "", data) {
  if (src == "tempdetails") {
    let logpath = __basedir + "/logs/timeout/";
    let filename = moment().format("YYYY-MM-DD") + ".log";
    let log_file = fs.createWriteStream(logpath + filename, {
      flags: "a",
      encoding: "utf-8",
      mode: "0666"
    });
    log_file.write(
      util.format({
        parentid,
        data
      }) + "\n\n"
    );
  }
};
