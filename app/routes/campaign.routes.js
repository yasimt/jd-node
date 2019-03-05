function initiator(routerApp, app) {
    // console.log('fsdgdfgsdfg');    
    app.use('/jdboxNode/campaignInfo', routerApp);
    var auth = require('../../config/auth.js');
    const CampaignDataClass = require('../controllers/campaign.controller.js');
    const CampaignDataClassObj = new CampaignDataClass();
    
    routerApp.post('/insrtCrisilData', (req,res) => {
        CampaignDataClassObj.insrtCrisilData(req,res)
    });
    routerApp.post('/fectCrisilData', (req,res) => {
        CampaignDataClassObj.fectCrisilData(req,res)
    });
    routerApp.post('/updtCrisilDataDoc', (req,res) => {
        CampaignDataClassObj.updtCrisilDataDoc(req,res)
    });
    routerApp.post('/insertSMELoanData', (req,res) => {
        CampaignDataClassObj.insertSMELoanData(req,res)
    });
    routerApp.post('/getSmeLoanData', (req,res) => {
        CampaignDataClassObj.getSmeLoanData(req,res)
    });
    routerApp.post('/getActiveCampaigns', (req,res) => {
        CampaignDataClassObj.getActiveCampaigns(req,res)
    });
    routerApp.post('/getPopularCats', (req,res) => {
        CampaignDataClassObj.getPopularCats(req,res)
    });
    routerApp.post('/getPopCatsNdActiveCamps', (req,res) => {
        CampaignDataClassObj.getPopCatsNdActiveCamps(req,res)
    });
    routerApp.post('/getOminitData', (req,res) => {
        CampaignDataClassObj.getOminitData(req,res)
    });
    app.use('/', routerApp);

   
}
module.exports = initiator;
