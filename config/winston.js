const {createLogger, format, transports} = require("winston");
const {combine, timestamp, prettyPrint} = format;
const moment = require("moment");
// define the custom settings for each transport (file, console)

let logpath = __basedir + "/logs/errors/";
let filename = logpath + moment().format("YYYY-MM-DD") + ".log";

var options = {
  file: {
    level: "info",
    filename: `${filename}`,
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true
  }
};

// instantiate a new Winston Logger with the settings defined above
const logger = createLogger({
  format: combine(timestamp({format: "YYYY-MM-DD hh:mm:ss"}), prettyPrint()),
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console)
  ],
  exceptionHandlers: [new transports.File(options.file)],
  exitOnError: false
});
/*
// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function(message, encoding) {
    // use the 'info' log level so the output will be picked up by both transports (file and console)
    logger.info(message);
  }
};
*/

module.exports = logger;
