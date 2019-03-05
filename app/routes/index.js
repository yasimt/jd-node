function initiator(routerApp, app) {
  require("../routes/user.routes.js")(routerApp, app);
  /* require('../routes/reseller.routes.js') (routerApp, app);
    require('../routes/payment.routes.js') (routerApp, app); */
  /*  require('../routes/invitation.routes.js') (routerApp, app); */
  require("../routes/finance.routes.js")(routerApp, app);
  require("../routes/contract.routes.js")(routerApp, app);
  require("../routes/bform.routes.js")(routerApp, app);
  require("../routes/globalapi.routes.js")(routerApp, app);
  require("../routes/campaign.routes.js")(routerApp, app);
  require("../routes/general.routes.js")(routerApp, app);
  require("../routes/test.routes.js")(routerApp, app);
  require("../routes/category.routes.js")(routerApp, app);
}
module.exports = initiator;
