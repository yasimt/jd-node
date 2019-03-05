function initiator(routerApp, app) {
    // console.log('fsdgdfgsdfg');    
    app.use('/jdboxNode/contract', routerApp);
    var auth = require('../../config/auth.js');
    const LocationDataClass = require('../controllers/contract.controller.js');

    const LocationDataClassObj = new LocationDataClass();
    
    routerApp.post('/getShadowTabData', (req,res) => {
        LocationDataClassObj.getContractInfoTable(req,res)
    });
    routerApp.post('/get_state', (req,res) => {
        LocationDataClassObj.getState(req,res);
    });
    routerApp.post('/get_city', (req,res) => {
        LocationDataClassObj.getCity(req,res)
    });
    routerApp.post('/pincode_master', (req,res) => {
        LocationDataClassObj.pincode_master(req,res)
    });
    routerApp.post('/insert_company_generalinfo', (req,res) => {
        LocationDataClassObj.insert_company_generalinfo(req,res)
    });
    routerApp.post('/updTimingTo24Hrs', (req,res) => {
        LocationDataClassObj.updTimingTo(req,res)
    });
    routerApp.post('/getRatingsAPI', (req,res) => {
        LocationDataClassObj.getRatingsAPI(req,res)
    });
    app.use('/', routerApp);
    routerApp.get('/LoadBalancerHealthCheck', (req,res) => {
        res.status(200).send("200");
    });
}
module.exports = initiator;
