const usermodel = require('../models/contract.model.js');
const dbconfig = require("../../config/database.config.js");
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const helperFunc = require('../utility/helperFunc.js');
const md5 = require('md5');
const myObj = require('../utility/connect.mysql.js');
const os = require('os');
const mom = require('moment');

const getCompGeneralExtraClass = require('./compdetail.controller.js');

const getCompGeneralExtraClasssObj = new getCompGeneralExtraClass();

class generalExtraClass {

    /*
        Purpose :- API to get the mobile,landline,stcode from shadow/Main Tables
        Method :-  Post
        Created by :- Apoorv Agrawal
        Date of creatiion :- 2018-11-22
        List of Parameters:- 
            1) In case for parentid :- {"parentid":"PXX22.XX22.180404160140.V1J7","pgno":1,"filterby":"parentid","ucode":"10033558","uname":"Apoorv Agrawal","data_city":"Mumbai"}
            2) In case of ucode :- {"parentid":"","pgno":1,"filterby":"ucode","ucode":"10033558","uname":"Apoorv Agrawal","data_city":"Mumbai"}
    */  
    async getMobileData(req,res) {
        if (!req.body.data_city || (req.body.data_city && req.body.data_city == "")) {
            return res.status(400).send({errorCode:1,errorStatus: "Data City is blank"});
        }
        if (!req.body.parentid || (req.body.parentid && req.body.parentid == "")) {
            return res.status(400).send({errorCode:1,errorStatus: "parentid is blank"});
        }
        if (!req.body.module || (req.body.module && req.body.module == "")) {
            return res.status(400).send({errorCode:1,errorStatus: "module is blank"});
        }
        if ( !req.body.table || (req.body.table && req.body.table == "") ) {
            var retArr = {errorCode:1,errorStatus: "table is blank"};
            return res.status(400).send(retArr);
        }
        const listOfTable = {
            tbl_companymaster_generalinfo_shadow:'tbl_companymaster_generalinfo_shadow',
            tbl_companymaster_extradetails_shadow:'tbl_companymaster_extradetails_shadow'
        }
        const listOfMainTable = {
            tbl_companymaster_generalinfo_shadow:'tbl_companymaster_generalinfo',
            tbl_companymaster_extradetails_shadow:'tbl_companymaster_extradetails'
        }
        // console.log(listOfTable[req.body.table]);

        if( typeof listOfTable[req.body.table] === "undefined" || ( listOfTable[req.body.table] && listOfTable[req.body.table] == "") ) {            
            var retArr = {errorCode:1,errorStatus: "table name is not proper"};
            // console.log(retArr);
            return res.status(500).send(retArr);
        }
        var thisObj = this;
        var postData = {};
        var parentid = req.body.parentid;
        req.body.fields = "mobile,parentid,landline,stdcode";
        postData['data'] = {};
        postData['data']['parentid'] = req.body.parentid;
        postData['data']['data_city'] = req.body.data_city.toLowerCase();
        postData['data']['module'] = req.body.module.toUpperCase();
        postData['data']['table'] = listOfTable[req.body.table];
        postData['data']['fields'] = req.body.fields;
        var curlTimeOut = {timeout:8000};
        // console.log(postData);
        var dataFoundFlg = 0;
        try{
            var getalldata = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/getdata",postData,'post',{},curlTimeOut);
            if( typeof getalldata === "undefined" || (getalldata && getalldata == "") ) {
                // get data from main Table
                dataFoundFlg = 1;
            }else{                
                getalldata = JSON.parse(getalldata);
                if( typeof getalldata.data === "undefined" || ( (!getalldata.data) || (getalldata.data && getalldata.data == "") ) ) {
                    // get data from main Table
                    dataFoundFlg = 1;
                }else{
                    if( !getalldata.data.mobile || (getalldata.data.mobile && getalldata.data.mobile == "") ) {
                        if( !getalldata.data.landline || (getalldata.data.landline && getalldata.data.landline == "") ) {
                            dataFoundFlg = 1;
                        }
                    }
                    var shadowInfo = {
                        data : getalldata.data,
                        errorCode : 0,
                        errorStatus : "Shadow Data Found"
                    };
                }
                if ( dataFoundFlg == 1 ) {
                    req.body.table = listOfMainTable[req.body.table];
                    var mainTabData = await getCompGeneralExtraClasssObj.getGeneralInfo(req);                        
                    if( helperFunc.undefNullEmptyCheck(mainTabData) && helperFunc.undefNullEmptyCheck(mainTabData['data']) ) {
                        if( mainTabData.errorCode == 0 ) {
                            var shadowInfo = {
                                data : mainTabData['data'],
                                errorCode : 0,
                                errorStatus : "Main Table Data Found"
                            };
                        }else{
                            var shadowInfo = {
                                data : {parentid:parentid},
                                errorCode : 1,
                                errorStatus : "Main Table Not Data Found"
                            };
                        }
                    }else{
                        var shadowInfo = {
                            data : {parentid:parentid},
                            errorCode : 1,
                            errorStatus : "Main Table Not Data Found"
                        };
                    }
                    return res.status(200).send(shadowInfo);
                }
                return res.status(200).send(shadowInfo);
            }
        }catch(err) {
            var shadowInfo = {
                data : {parentid:parentid},
                errorCode : 1,
                errorStatus : err.stack
            };
            return res.status(500).send(shadowInfo);
        }
    };
}
module.exports = generalExtraClass;
