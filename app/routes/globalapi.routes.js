function initiator(routerApp, app) {
    // console.log('fsdgdfgsdfg');    

    app.use('/jdboxNode/globalapi', routerApp);
    const auth = require('../../config/auth.js');
    const logger = require(__basedir + "/config/winston");

    const GlobalAPIClass = require('../controllers/globalcompapi.controller.js');

    const GlobalAPIClassObj = new GlobalAPIClass();

    try{

        routerApp.post('/getglobalcompapi', async function(req,res){
            
            let res_json = await GlobalAPIClassObj.validateCompData(req.body);

            if(Object.keys(res_json).length!=0){
                return res.status(200).json({"valid": 0, "error": 1, "data": res_json});
            }
            else{
                return res.status(200).json({"valid": 1, "error": 0, "data": res_json});
            }
        });           
    }
    catch(ex){

        let err = "";
        if (!ex.message) {
            err = ex;
        } else {
            err = ex.stack;
        }

        logger.error("Caught Exception!!!", err);

        return res.status(422).json({"valid": 0, "error": 1, "msg": err});
    }
}
module.exports = initiator;
