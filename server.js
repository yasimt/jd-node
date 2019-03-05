//Reseller APIs Server connection file
var express = require('express');
var multer = require('multer');
var app = express();
var bodyParser = require('body-parser');
var url = require('url');
var sessionObj = require('./app/models/session.model.js');
global.__basedir = __dirname;
var logger = require("./config/winston");
var morgan = require("morgan");

morgan.token("date", function() {
  return new Date().toString();
});
app.use(morgan("combined"));

app.use(function (req, resp, next) {
    resp.header('Access-Control-Allow-Origin', "*");
    resp.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
    resp.header('Access-Control-Allow-Headers', 'content-Type,x-requested-with,beartoken,authtoken');
    next();
});

//to parse xwww calls
app.use(bodyParser.urlencoded({extended: true}));
//to parse json calls
app.use(bodyParser.json());
app.set('view engine', 'ejs');

var Storage = multer.diskStorage({
     destination: function(req, file, callback) {
        callback(null, "./Images");
     },
     filename: function(req, file, callback) {
        console.log(req.body);
        console.log(file);
        callback(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
     }
 });
 //var upload = multer({storage: Storage}).array("imgUploader", 3); //Field name and max count
 //to parse multipart formdata
app.use(multer({storage: Storage}).array("uploader", 10));

const dbConfig = require('./config/database.config.js');

var port = process.env.PORT || 8082;
var routerApp = express.Router();
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(dbConfig.mongodevurl)
.then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...');
    process.exit();
});

var requireObj = require('./app/routes/index.js')(routerApp, app);

process
  .on("unhandledRejection", (reason, p) => {
    //console.log(reason, "Unhandled Rejection at Promise", p);
    logger.error("unhandledRejection", reason);
  })
  .on("uncaughtException", err => {
    //console.error(err, "Uncaught Exception thrown");
    logger.error("Uncaught Exception thrown !!!", err);
  });

var requireUncached = module => {
  delete require.cache[require.resolve(module)];
  return require(module);
};

var serverObj = app.listen(port);
serverObj.timeout = 10000;
console.log('JDBOX started on port ' + port);

