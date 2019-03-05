function intiator(routerApp,app) {
    app.use('/reseller_services/payment', routerApp);
    var auth = require('../../config/auth.js');
    const paymentCont = require('../controllers/payment.controller.js');
    routerApp.post('/payment-master', paymentCont.insertPaymentData);
    routerApp.post('/fetch-payment', paymentCont.getPaymentData);
    routerApp.post('/make-payment', paymentCont.makePayment);
    routerApp.get('/payment-trans-details', paymentCont.paymentTrasnDet);
    routerApp.post('/update-payment-details', paymentCont.updatePaymentDetails);
}
module.exports = intiator;