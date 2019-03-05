function initiator(routerApp, app) {  
    app.use('/jdboxNode/category', routerApp);
    const CategoryDataClass = require('../controllers/category.controller.js');
    const CategoryDataClassObj = new CategoryDataClass();

    routerApp.post('/findCatParentage', (req, res) => {
        console.log('fdvdf');
        CategoryDataClassObj.findCatParentage(req, res);
    });
    routerApp.post('/insrtCatDataLite', (req, res) => {
        console.log('insrtCatDataLite');
        CategoryDataClassObj.insrtCatDataLite(req, res);
    });
    routerApp.post('/updateCatIds', (req, res) => {
        console.log('updateCatIds');
        CategoryDataClassObj.updateCatIds(req, res);
    });
    routerApp.post('/extactRenewalUpdateCats', (req, res) => {
        CategoryDataClassObj.extactRenewalUpdateCats(req, res);
    });
}
module.exports = initiator;
