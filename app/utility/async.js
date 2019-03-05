var logger = require(__basedir + "/config/winston");
module.exports = function(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (ex) {
      //next(ex);
      let err = "";
      if (!ex.message) {
        err = ex;
      } else {
        err = ex.stack;
      }
      logger.error("Caught Exception!!!", err);
      res.json({errors: {code: 1, msg: err}});
    }
  };
};
