var errno = require("errno");
module.exports = function errorInfo(err) {
  let str = "Error: ";
  // if it's a libuv error then get the description from errno
  if (errno.errno[err.errno]) str += errno.errno[err.errno].description;
  else str += err.message;

  // if it's a `fs` error then it'll have a 'path' property
  if (err.path) str += " [" + err.path + "]";
  return str;
};
