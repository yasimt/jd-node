function initiator(routerApp, app) {    
    app.use('/jdboxNode/reseller', routerApp);
    const resellerCont = require('../controllers/reseller.controller.js');
    routerApp.get('/user-info-check', resellerCont.checkUserLogin);
    routerApp.post('/reseller-register', resellerCont.insertReseller);
    routerApp.post('/check-otp', resellerCont.checkOTP);
    routerApp.get('/update-reseller-state', resellerCont.updateResellerState);
    routerApp.post('/send-invite', resellerCont.sendInvite);
    routerApp.post('/get-network', resellerCont.getLineage);
    routerApp.post('/save-reseller-kyc', resellerCont.addKycDocs);
    routerApp.post('/check-reseller-kyc', resellerCont.checkKYC);
    routerApp.post('/resend-otp', resellerCont.resendOTP);
}
module.exports = initiator;