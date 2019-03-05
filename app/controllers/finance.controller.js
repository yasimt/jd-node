const dbconfig = require("../../config/database.config.js");
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const helperFunc = require('../utility/helperFunc.js');
const myObj = require('../utility/connect.mysql.js');

exports.checkPendingInstrument = async (req, res) => {
    if (!req.body.parentid || (req.body.parentid && req.body.parentid == "")) {
        return res.status(400).send({errroCode:1,errorMsg:"Please send parentid of the contract"});
    }
    if (!req.body.data_city || (req.body.data_city && req.body.data_city == "")) {
        return res.status(400).send({errroCode:1,errorMsg:"Please send data city of the contract"});
    }
    var cityConnect = "";
    if (helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
        cityConnect = "remote";
    } else {
        cityConnect = req.body.data_city.toLowerCase();
    }
    try{
        let mysqlFinObj = new myObj(dbconfig['finance'][cityConnect]);
        var findPenInstr = await mysqlFinObj.query("SELECT instrumentId FROM db_finance.payment_instrument_summary WHERE parentid='" + req.body.parentid+"' AND approvalStatus=0");
        if (findPenInstr.length > 0) {
            res.status(200).send({ errorCode: 1, errorMsg: "You cannot edit this contract as it is having a pending unapproved instrument" });
        } else {
            res.status(200).send({ errorCode: 0, errorMsg: "You can edit this contract" });
        }
    } catch(err) {
        res.status(500).send({ errorCode: 1, errorMsg: err.stack});
    }
}