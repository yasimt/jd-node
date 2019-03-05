function initiator(routerApp, app) {
    app.use('/jdboxNode/invite', routerApp);
    const resellerCont = require('../controllers/reseller.controller.js');
    routerApp.get('/:shortid', resellerCont.checkInvitation);
}
module.exports = initiator;