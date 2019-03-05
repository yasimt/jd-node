function initiator(routerApp, app) {
    app.use('/jdboxNode/generalInfo', routerApp);
    var auth = require('../../config/auth.js');
    const GeneralDataClass = require('../controllers/general.controller.js');
    const GeneralDataClassObj = new GeneralDataClass();
    
    routerApp.post('/getGeneralMobileData', (req,res) => {
        GeneralDataClassObj.getMobileData(req,res)
    });
    // routerApp.post('/checkExistingCat', (req,res) => {
    //     CategoryDataClassObj.checkExistingCat(req,res)
    // });
    
    app.use('/', routerApp);

   
}
module.exports = initiator;
