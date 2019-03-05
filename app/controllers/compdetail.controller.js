const usermodel = require('../models/contract.model.js');
const dbconfig = require("../../config/database.config.js");
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const helperFunc = require('../utility/helperFunc.js');
const md5 = require('md5');
const myObj = require('../utility/connect.mysql.js');
const os = require('os');
const mom = require('moment');

class getCompGeneralExtraClass {
    async getGeneralInfo(req){
        var retArr = {};
        if ( !req.body.data_city || (req.body.data_city && req.body.data_city == "") ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            return retArr;
        }
        if ( !req.body.module || (req.body.module && req.body.module == "") ) {
            retArr = {errorCode:1,errorStatus: "module is blank"};
            return retArr;
        }
        if ( !req.body.parentid || (req.body.parentid && req.body.parentid == "") ) {
            retArr = {errorCode:1,errorStatus: "parentid is blank"};
            return retArr;
        }
        if ( !req.body.fields || (req.body.fields && req.body.fields == "") ) {            
            retArr = {errorCode:1,errorStatus: "fields is blank"};
            return retArr;
        }
        if ( !req.body.table || (req.body.table && req.body.table == "") ) {
            retArr = {errorCode:1,errorStatus: "table is blank"};
            return retArr;
        }

        var listOfParId = req.body.parentid.split(',');
        // console.log(listOfParId);

        const listOfTable = {
            tbl_companymaster_generalinfo:'gen_info_id',
            tbl_companymaster_extradetails:'extra_det_id',
            tbl_companymaster_search:'srch_det_id',
            tbl_id_generator:'tbl_id_generator'
        }
        // console.log(listOfTable[req.body.table]);

        if( typeof listOfTable[req.body.table] === "undefined" || ( listOfTable[req.body.table] && listOfTable[req.body.table] == "") ) {
            retArr = {errorCode:1,errorStatus: "table name is not proper"};
            // console.log(retArr);
            return retArr;
        }
        var type = listOfTable[req.body.table];
        var city = req.body.data_city;
        var rsrc = req.body.module.toLowerCase();
        var fields = req.body.fields;
        // var module = req.body.module;
        var pid = req.body.parentid;
        var curlTimeOut = {timeout:8000};
        try{            
            var url = paths.MAIN_TAB_API+"/api/comp/get?type="+type+"&pid="+pid+"&city="+city+"&fields="+fields+"&rsrc="+rsrc+"&debug=1";
            console.log("11111111111111 url : ",url);
            var getMainData = await curlObj.curlCall('xxx', url, {},'get',curlTimeOut);
            getMainData = JSON.parse(getMainData);
            // console.log(getMainData['results']['data']);
            if( !helperFunc.undefNullEmptyCheck(getMainData) ){
                var retArr = {
                    data : '',
                    errorCode : 1,
                    errorStatus: 'Data Not Found'
                }
                return retArr;
            }else if ( !helperFunc.undefNullEmptyCheck(getMainData['results']) ) {
                var retArr = {
                    data : '',
                    errorCode : 1,
                    errorStatus: 'Data Not Found'
                };
                return retArr;
            }else if ( !helperFunc.undefNullEmptyCheck(getMainData['results']['data']) ) {
                var retArr = {
                    data : '',
                    errorCode : 1,
                    errorStatus: 'Data Not Found'
                };
                return retArr;
            }else{
                var finalResp = Object.values(getMainData['results']['data']);
                finalResp = Object.assign({}, finalResp);
                if (typeof req.body.getAll !== 'undefined' && req.body.getAll == 'all' ) {
                    var myResp = finalResp;
                } else {
                    var myResp = finalResp[0];
                }
                // console.log(finalResp);
                var retArr = {
                    data : myResp,
                    errorCode : 0,
                    errorStatus: 'Data Found'
                };
                // console.log("retArr");
                // console.log(retArr);
                return retArr;
            }
        }catch(err){
            var retArr = {
                data:'',
                errorCode : 1,
                errorStatus : "Data Not Found "+err
            };
            return retArr;
        }
    };
}
module.exports = getCompGeneralExtraClass;
