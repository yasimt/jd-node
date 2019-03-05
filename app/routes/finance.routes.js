function initiator(routerApp, app) {
    app.use('/jdboxNode/mumbai/finance', routerApp);
    app.use('/jdboxNode/delhi/finance', routerApp);
    app.use('/jdboxNode/kolkata/finance', routerApp);
    app.use('/jdboxNode/bangalore/finance', routerApp);
    app.use('/jdboxNode/chennai/finance', routerApp);
    app.use('/jdboxNode/pune/finance', routerApp);
    app.use('/jdboxNode/hyderabad/finance', routerApp);
    app.use('/jdboxNode/ahmedabad/finance', routerApp);
    app.use('/jdboxNode/remote/finance', routerApp);
    const resellerCont = require('../controllers/finance.controller.js');
    routerApp.post('/check-pending-instr', resellerCont.checkPendingInstrument);
}
module.exports = initiator;