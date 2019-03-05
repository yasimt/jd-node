function initiator(routerApp, app) {
    
    app.use('/jdboxNode/user', routerApp);
    var auth = require('../../config/auth.js');
    const userCont = require('../controllers/user.controller.js');
    routerApp.post('/get-user-info', userCont.getUserInfo);
    routerApp.post('/get-menudispostion-info', userCont.getMenudispostionInfo);
}
module.exports = initiator;
