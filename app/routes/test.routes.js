function initiator(routerApp, app) {
    // console.log('fsdgdfgsdfg');    
    app.use('/jdboxNode/test', routerApp);
    var auth = require('../../config/auth.js');
    const TestDataClass = require('../controllers/test.controller.js');
    const TestDataClassObj = new TestDataClass();
    
    routerApp.post('/testEmail', (req,res) => {
        TestDataClassObj.testEmail(req,res)
    });

    app.use('/', routerApp);

   
}
module.exports = initiator;
