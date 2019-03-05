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

const getCompGeneralExtraClsObj = new getCompGeneralExtraClass();

class CampaignDataClass {
    /* 
        API to insert CRISIL Form Data
        Params required : parentid,module,data_city,empcode,client_info_data {CRISIL Form data is json format}
        Data Of Creation/Requirment : 2018-11-02
        Author : Apoorv Agrawal
        DataBase Details : 172.223 {online_resis_x [x:mumbai, ..., remote_cities]}
    */ 
    async insrtCrisilData(req,res) {
        var retArr = {};
        if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
            retArr = {errorCode:1,errorStatus: "module is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
            retArr = {errorCode:1,errorStatus: "parentid is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.empcode) ) {
            retArr = {errorCode:1,errorStatus: "empcode is blank"};
            return res.status(400).send(retArr);
        }
        var data_city = req.body.data_city;
        var module = req.body.module;
        var parentid = req.body.parentid;
        var version = ( helperFunc.undefNullEmptyCheck(req.body.version) ) ? req.body.version : "";
        var empcode = req.body.empcode;
        var client_info_data = ( helperFunc.undefNullEmptyCheck(req.body.client_info_data) ) ? req.body.client_info_data : "";
        if(client_info_data != "") {
            client_info_data = helperFunc.stripslashes(client_info_data);
            client_info_data = helperFunc.addslashes(client_info_data);
        }

        try{
            var date = mom(new Date()).format("YYYY-MM-DD HH:mm:ss");
            var cityConnect = "";
            if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
                cityConnect = "remote";
            } else {
                cityConnect = data_city.toLowerCase();
            }
            var dbParamIdc = dbconfig['idc'][cityConnect];
            var mysqlObjIdc = new myObj(dbParamIdc);
            var sqlisActive_crisil_campaign = "SELECT parentid FROM tbl_crisil_campaign_lite WHERE ( parentid = '"+parentid+"' AND isActive = 1 ) LIMIT 1";
            // console.log(sqlCatInfo);
            var resisActive_crisil_campaign = await mysqlObjIdc.query(sqlisActive_crisil_campaign);
            if ( helperFunc.undefNullEmptyCheck(resisActive_crisil_campaign) ) {
                if ( helperFunc.undefNullEmptyCheck(resisActive_crisil_campaign[0]) ) {
                    var updtQrCrisilCampaign = "Update tbl_crisil_campaign_lite SET isActive = 0,updated_on = '"+date+"'  WHERE parentid = '"+parentid+"' ";
                    var dbParamIdc = dbconfig['idc'][cityConnect];
                    var mysqlObjIdc = new myObj(dbParamIdc);
                    var resUpdtQrCrisilCampaign = await mysqlObjIdc.query(updtQrCrisilCampaign);
                }
            }
            try{
                var insrtCrisilData = "Insert INTO tbl_crisil_campaign_lite SET parentid = '"+parentid+"',empcode = '"+empcode+"',module = '"+module+"',entry_date = '"+date+"',client_info_data= '"+client_info_data+"',document='',version='"+version+"' ";
                console.log(insrtCrisilData);
                var dbParamIdc = dbconfig['idc'][cityConnect];
                var mysqlObjIdc = new myObj(dbParamIdc);
                var insrtCrisilData = await mysqlObjIdc.query(insrtCrisilData);
                if ( helperFunc.undefNullEmptyCheck(insrtCrisilData) ) {
                    retArr = {errorCode:0,errorStatus: "Data Inserted Success"};
                    return res.status(200).send(retArr);    
                }else{
                    retArr = {errorCode:1,errorStatus: "Oops there is some error insertion1"};
                    return res.status(400).send(retArr);
                }
            }catch(e) {
                retArr = {errorCode:1,errorStatus: "Oops there is some error insertion2 "+e.stack};
                return res.status(400).send(retArr);
            }
        }catch(e) {
            retArr = {errorCode:1,errorStatus: "Oops there is some error "+e.stack};
            return res.status(400).send(retArr);
        }
    }

    /* 
        API to get CRISIL Data
        Params required : parentid,module,data_city
        Data Of Creation/Requirment : 2018-11-02
        Author : Apoorv Agrawal
        DataBase Details : 172.223 {online_resis_x [x:mumbai, ..., remote_cities]}
    */ 
    async fectCrisilData(req,res) {
        var retArr = {};
        if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
            retArr = {errorCode:1,errorStatus: "module is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
            retArr = {errorCode:1,errorStatus: "parentid is blank"};
            return res.status(400).send(retArr);
        }
        var parentid = req.body.parentid;
        var module = req.body.module;
        var data_city = req.body.data_city;
        var cityConnect = "";
        if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
            cityConnect = "remote";
        } else {
            cityConnect = data_city.toLowerCase();
        }
        try{
            var dbParamIdc = dbconfig['idc'][cityConnect];
            var mysqlObjIdc = new myObj(dbParamIdc);
            var getCrisilCampaign = "SELECT parentid,client_info_data,document,empcode,module,version,isActive,deal_close,entry_date,updated_on FROM tbl_crisil_campaign_lite WHERE ( parentid = '"+parentid+"' AND isActive = 1 ) LIMIT 1";
            var dataGetCrisilCampaign = await mysqlObjIdc.query(getCrisilCampaign);
            if( helperFunc.undefNullEmptyCheck(dataGetCrisilCampaign) ) {
                if( helperFunc.undefNullEmptyCheck(dataGetCrisilCampaign[0]) ) {
                    retArr = {errorCode:0,errorStatus: "Data Found",data:dataGetCrisilCampaign[0]};
                    return res.status(200).send(retArr);
                }else{
                    retArr = {errorCode:1,errorStatus: "Data Not Found",data:""};
                    return res.status(200).send(retArr);
                }
            }else{
                retArr = {errorCode:1,errorStatus: "Data Not Found",data:""};
                return res.status(200).send(retArr);
            }
        }catch(e) {
            retArr = {errorCode:1,errorStatus: "Oops Some Error "+e.stack,data:""};
            return res.status(400).send(retArr);
        }
    }
    /*
        API to Update the Document Uploaded
        Parameter Required : parentid,data_city,module,document_data {Dodument data in json format}
        DATE Of Creation/Requirment : 2018-11-02
        Author : Apoorv Agrawal
        DataBase Details : 172.223 {online_resis_x [x:mumbai, ..., remote_cities]}
    */
    async updtCrisilDataDoc(req,res) {
        var retArr = {};
        if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
            retArr = {errorCode:1,errorStatus: "module is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
            retArr = {errorCode:1,errorStatus: "parentid is blank"};
            return res.status(400).send(retArr);
        }
        var parentid = req.body.parentid;
        var module = req.body.module;
        var data_city = req.body.data_city;
        var cityConnect = "";
        var document_data = ( helperFunc.undefNullEmptyCheck(req.body.document_data) ) ? req.body.document_data : "" ;
        if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
            cityConnect = "remote";
        } else {
            cityConnect = data_city.toLowerCase();
        }
        try{
            var date = mom(new Date()).format("YYYY-MM-DD HH:mm:ss");
            var dbParamIdc = dbconfig['idc'][cityConnect];
            var mysqlObjIdc = new myObj(dbParamIdc);
            var getCrisilCampaign = "SELECT parentid,client_info_data,document,empcode,module,version,isActive,deal_close,entry_date,updated_on FROM tbl_crisil_campaign_lite WHERE ( parentid = '"+parentid+"' AND isActive = 1 ) LIMIT 1";
            var dataGetCrisilCampaign = await mysqlObjIdc.query(getCrisilCampaign);
            if( helperFunc.undefNullEmptyCheck(dataGetCrisilCampaign) ) {
                if( helperFunc.undefNullEmptyCheck(dataGetCrisilCampaign[0]) ) {
                    // Write Update Query Here
                    try {
                        var dbParamIdc = dbconfig['idc'][cityConnect];
                        var mysqlObjIdc = new myObj(dbParamIdc);
                        var updtDocCrisilQr = "UPDATE tbl_crisil_campaign_lite SET document = '"+document_data+"',updated_on = '"+date+"' WHERE ( parentid = '"+parentid+"' AND isActive = 1 ) LIMIT 1 ";
                        var updtDocCrisilQrCon = await mysqlObjIdc.query(updtDocCrisilQr);
                        if( helperFunc.undefNullEmptyCheck(updtDocCrisilQrCon) ){
                            retArr = {errorCode:0,errorStatus: "Data Updated Success"};
                            return res.status(200).send(retArr);
                        }else{
                            retArr = {errorCode:1,errorStatus: "Data Updated Failed"};
                            return res.status(200).send(retArr);
                        }
                    }catch(e) {
                        retArr = {errorCode:1,errorStatus: "Oops Some Error "+e.stack};
                        return res.status(400).send(retArr);
                    }
                }else{
                    retArr = {errorCode:1,errorStatus: "Data Not Found"};
                    return res.status(200).send(retArr);
                }
            }else{
                retArr = {errorCode:1,errorStatus: "Data Not Found"};
                return res.status(200).send(retArr);
            }            
        }catch(e){
            retArr = {errorCode:1,errorStatus: "Oops Some Error "+e.stack};
            return res.status(400).send(retArr);
        }
    }

    async insertSMELoanData(req,res) {
        var retArr = {};
        if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
            retArr = {errorCode:1,errorStatus: "module is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
            retArr = {errorCode:1,errorStatus: "parentid is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.empcode) ) {
            retArr = {errorCode:1,errorStatus: "empcode is blank"};
            return res.status(400).send(retArr);
        }
        if ( !helperFunc.undefNullEmptyCheck(req.body.sme_loan_data) ) {
            retArr = {errorCode:1,errorStatus: "sme_loan_data is blank"};
            return res.status(400).send(retArr);
        }

        var data_city = req.body.data_city;
        var module = req.body.module;
        var parentid = req.body.parentid;        
        var empcode = req.body.empcode;
        var sme_loan_data = ( helperFunc.undefNullEmptyCheck(req.body.sme_loan_data) ) ? req.body.sme_loan_data : "";
        try{
            var date = mom(new Date()).format("YYYY-MM-DD HH:mm:ss");
            var cityConnect = "";
            if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
                cityConnect = "remote";
            } else {
                cityConnect = data_city.toLowerCase();
            }
            try{
                if(sme_loan_data != "") {
                    sme_loan_data = helperFunc.stripslashes(sme_loan_data);
                    sme_loan_data = helperFunc.addslashes(sme_loan_data);
                }
                var insrtSmeLoanData = "Insert INTO tbl_sme_loanInfo SET parentid = '"+parentid+"',empcode = '"+empcode+"',module = '"+module+"',entry_date = '"+date+"',sme_loan_json= '"+sme_loan_data+"',update_date='"+date+"',data_city='"+data_city+"' ON DUPLICATE KEY UPDATE empcode = '"+empcode+"',sme_loan_json= '"+sme_loan_data+"',update_date='"+date+"',data_city='"+data_city+"'";
                var dbParamIdc = dbconfig['idc'][cityConnect];
                var mysqlObjIdc = new myObj(dbParamIdc);
                var insrtSmeLoanResp = await mysqlObjIdc.query(insrtSmeLoanData);
                if ( helperFunc.undefNullEmptyCheck(insrtSmeLoanResp) ) {
                    retArr = {errorCode:0,errorStatus: "Data Inserted Success"};
                }else{
                    retArr = {errorCode:1,errorStatus: "Oops there is some error insertion1"};
                }
                if( retArr['errorCode'] == 0 ) {                    
                    var insrtSmeLoanDataLog = "Insert INTO online_regis.tbl_sme_loanInfo_log SET parentid = '"+parentid+"',empcode = '"+empcode+"',module = '"+module+"',entry_date = '"+date+"',sme_loan_json= '"+sme_loan_data+"',update_date='"+date+"',data_city='"+data_city+"'";
                    var dbParamIdc = dbconfig['idc'][cityConnect];
                    var mysqlObjIdc = new myObj(dbParamIdc);
                    var insrtSmeLoanLogResp = await mysqlObjIdc.query(insrtSmeLoanDataLog);
                    if ( helperFunc.undefNullEmptyCheck(insrtSmeLoanLogResp) ) {
                        retArr = {errorCode:0,errorStatus: "Data Inserted Success"};
                        return res.status(200).send(retArr);
                    }else{
                        retArr = {errorCode:1,errorStatus: "Oops there is some error insertion1"};
                        return res.status(400).send(retArr);
                    }
                }else{
                    return res.status(400).send(retArr);
                }
            }catch(e) {
                retArr = {errorCode:1,errorStatus: "Oops there is some error insertion2 "+e.stack};
                return res.status(400).send(retArr);
            }
        }catch(e) {
            retArr = {errorCode:1,errorStatus: "Oops there is some error "+e.stack};
            return res.status(400).send(retArr);
        }
    }
    async getSmeLoanData(req,res) {
        var retArr = {};
        try{

            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "Data City is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retArr = {errorCode:1,errorStatus: "parentid is blank"};
                return res.status(400).send(retArr);
            }
            var data_city = req.body.data_city;
            var parentid = req.body.parentid;
            var cityConnect = "";
            if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
                cityConnect = "remote";
            } else {
                cityConnect = data_city.toLowerCase();
            }
            try{

                var dbParamIdc = dbconfig['idc'][cityConnect];
                var mysqlObjIdc = new myObj(dbParamIdc);
                var fetchSmeQr = "SELECT parentid,sme_loan_json,module,data_city,empcode,entry_date,update_date FROM tbl_sme_loanInfo where parentid = '"+parentid+"'";
                var fetchSmeQrResp = await mysqlObjIdc.query(fetchSmeQr);
                if ( helperFunc.undefNullEmptyCheck(fetchSmeQrResp) ) {
                    if ( helperFunc.undefNullEmptyCheck(fetchSmeQrResp[0]['sme_loan_json']) ) {
                        fetchSmeQrResp[0]['sme_loan_json'] = JSON.parse(fetchSmeQrResp[0]['sme_loan_json']);
                    }
                    
                    retArr = {errorCode:0,errorStatus: "Data found",data:fetchSmeQrResp};
                }else{
                    retArr = {errorCode:1,errorStatus: "Data not found"};
                }
                if(retArr['errorCode'] == 1) {
                    return res.status(200).send(retArr);
                }else{
                    return res.status(200).send(retArr);
                }
            }catch(e) {
                retArr = {errorCode:1,errorStatus: e.stack};
                return res.status(500).send({retArr});                
            }
        }catch(e) {
            retArr = {errorCode:1,errorStatus: e.stack};
            return res.status(500).send({retArr});
        }
    }

    async getActiveCampaigns(req,res) {
        var retArr = {};
        try{
            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "Data City is blank"};
                // return res.status(400).send(retArr);
                return retArr;
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retArr = {errorCode:1,errorStatus: "parentid is blank"};
                // return res.status(400).send(retArr);
                return retArr;
            }
            var data_city = req.body.data_city;
            var parentid = req.body.parentid;
            var cityConnect = "";
            if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
                cityConnect = "remote";
            } else {
                cityConnect = data_city.toLowerCase();
            }
            try {
                parentid = parentid.replace(/,\s*$/, "");
                if( parentid.indexOf(",") > -1 ) {
                    var splitParid = parentid.split(',');
                    var paridStr = splitParid.join("','");                    
                }else{
                    var paridStr = parentid;
                }
                var dbParamFin = dbconfig['finance'][cityConnect];
                var mysqlObjFin = new myObj(dbParamFin);
                var getActiveCampQr = "Select GROUP_CONCAT(a.campaignid) AS campaignid ,GROUP_CONCAT(b.campaignName,' ') AS campaignName,a.parentid from db_finance.tbl_companymaster_finance as a JOIN `db_finance`.payment_campaign_master as b ON (a.campaignid = b.campaignId) Where a.parentid IN ('"+paridStr+"') AND a.balance > 0 GROUP BY a.parentid ";

                var getActiveCampQrResp = await mysqlObjFin.query(getActiveCampQr);
                if ( helperFunc.undefNullEmptyCheck(getActiveCampQrResp) ) {
                    retArr = {errorCode:0,errorStatus: "Data found",data:getActiveCampQrResp};
                }else{
                    retArr = {errorCode:1,errorStatus: "Data not found"};
                }
                var dbParamIdc = dbconfig['idc'][cityConnect];
                var mysqlObjIdc = new myObj(dbParamIdc);
                var nationalListQr = "SELECT parentid,campaignid FROM `db_national_listing`.tbl_companymaster_finance_national WHERE parentid IN ('"+paridStr+"') AND campaignid = '10'"; 
                var nationalListQrResp = await mysqlObjIdc.query(nationalListQr);
                if ( helperFunc.undefNullEmptyCheck(nationalListQrResp) ) {
                    if( retArr['errorCode'] == 0 ) {
                        for( var x in nationalListQrResp ) {
                            for( var y in retArr['data'] ) {
                                if (retArr['data'][y]['parentid'] == nationalListQrResp[x]['parentid'] ) {
                                    retArr['data'][y]['campaignName'] = retArr['data'][y]['campaignName']+', National Listing';
                                }
                            }
                        }
                    }
                }
                if( retArr.errorCode == 1 ) {
                    // return res.status(400).send(retArr);
                    return retArr;
                } else {
                    // return res.status(200).send(retArr);
                    return retArr;
                }
            }catch(e) {
                retArr = {errorCode:1,errorStatus: e.stack};
                // return res.status(500).send({retArr});
                return retArr;
            }
        }catch(e){
            retArr = {errorCode:1,errorStatus: e.stack};
            // return res.status(500).send({retArr});
            return retArr;
        }
    }
    async getPopularCats(req,res) {
        // getCompGeneralExtraClsObj
        try{
            var hotCatRespArr = [];
            var retArr = {};
            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "Data City is blank"};
                // return res.status(400).send(retArr);
                return retArr;
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retArr = {errorCode:1,errorStatus: "parentid is blank"};
                // return res.status(400).send(retArr);
                return retArr;
            }
            req.body.table = 'tbl_companymaster_extradetails';
            req.body.fields = "hotcategory,parentid";
            req.body.module = "me";
            req.body.getAll = "all";
            var mainExtraTabData = await getCompGeneralExtraClsObj.getGeneralInfo(req);
            // console.log("mainExtraTabData :",mainExtraTabData);
            // return;
            if( helperFunc.undefNullEmptyCheck(mainExtraTabData) && helperFunc.undefNullEmptyCheck(mainExtraTabData['data']) ) {
                if( typeof mainExtraTabData['data'] !== "undefined" && mainExtraTabData['data'] ) {
                    hotCatRespArr = mainExtraTabData['data'];
                    console.log("hotCatRespArr : ",hotCatRespArr);
                    retArr = {errorCode:0,errorStatus: "Hot Category Found"};
                }else {
                    retArr = {errorCode:1,errorStatus: "Hot Category Not Found"};
                }
            }else{
                retArr = {errorCode:1,errorStatus: "Hot Category Not Found"};
            }
            if( retArr['errorCode'] == 1 ) {
                // return res.status(400).send(retArr);
                return retArr;
            }else{
                var myObj = {};
                var listofHotCats = "";                
                for(var x in hotCatRespArr) {
                    if ( hotCatRespArr[x]['hotcategory'] && typeof hotCatRespArr[x]['hotcategory'] !== "undefined" && hotCatRespArr[x]['hotcategory'] != "" ) {
                        let catid = hotCatRespArr[x]['hotcategory'].replace(/^\/|\/$/g, '');
                        listofHotCats = listofHotCats+catid.toString()+',';
                        // myObj[hotCatRespArr[x]['parentid']] = {'hotcategory': catid,parenitd:hotCatRespArr[x]['parentid']};
                    } else {
                        // myObj[hotCatRespArr[x]['parentid']] = {'hotcategory': hotCatRespArr[x]['hotcategory'],parenitd:hotCatRespArr[x]['parentid']};
                    }
                }
                listofHotCats = listofHotCats.replace(/,\s*$/, "");
                var curlTimeOut = {timeout:8000};
                var getCatNameUrl = paths.jdboxurl+'/services/category_data_api.php'+'?city='+encodeURI(req.body.data_city)+'&module='+req.body.module+'&where={"catid":"'+listofHotCats+'"}&return=catid,category_name&orderby=callcount desc';
                myObj['Category Name Fetch URl'] = getCatNameUrl;                
                try {
                    var getCatNameAPIResp = await curlObj.curlCall('xxx', getCatNameUrl, {},'get',curlTimeOut);
                    if( helperFunc.undefNullEmptyCheck(getCatNameAPIResp) ) {                        
                        getCatNameAPIResp = JSON.parse(getCatNameAPIResp);                        
                        for(var x in hotCatRespArr) {
                            if ( hotCatRespArr[x]['hotcategory'] && typeof hotCatRespArr[x]['hotcategory'] !== "undefined" && hotCatRespArr[x]['hotcategory'] != "" ) {
                                hotCatRespArr[x]['hotcategory'] = hotCatRespArr[x]['hotcategory'].replace(/^\/|\/$/g, '');
                                var catid = hotCatRespArr[x]['hotcategory'].replace(/^\/|\/$/g, '');
                            } else {
                                var catid = "";
                            }
                            for(var i = 0; i < getCatNameAPIResp['results'].length; i++) {
                                if ( getCatNameAPIResp['results'][i].catid == catid ) {
                                    hotCatRespArr[x]['catName'] = getCatNameAPIResp['results'][i].category_name;
                                    break;
                                }
                            }
                        }
                        retArr = {errorCode:0,errorStatus: "Hot Category Found",data:hotCatRespArr};
                        // return res.status(200).send(retArr);
                        return retArr;
                    }
                }catch(err) {
                    var retArr = {
                        errorCode : 1,
                        errorStatus : 'Category Name API Failure'+err.stack
                    };
                    return retArr;
                    // return res.status(500).send(retArr);
                }
            }
        } catch(e) {
            retArr = {errorCode:1,errorStatus: e.stack};
            return retArr;
            // return res.status(500).send({retArr});
        }
    }
    async getPopCatsNdActiveCamps(req,res) {
        var retArr = {};
        var thisObj = this;
        try {
            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "Data City is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retArr = {errorCode:1,errorStatus: "parentid is blank"};
                return res.status(400).send(retArr);
            }
            // req.body.parentid = "PXX22.XX22.190123152843.W8B3,PXX22.XX22.190110182929.U2Z4,PXX22.XX22.190122161429.A6R1,PXX22.XX22.190122120119.C7J7,PXX22.XX22.190122110926.V5J3,PXX22.XX22.190121164544.B8X3,PXX22.XX22.180622113339.D7Q6,PXX22.XX22.181207130339.Y2B5,PXX22.XX22.181206175712.E8U7,PXX22.XX22.180716115013.W7U2";
            var parentid = req.body.parentid;
            var myObj = {
                'getPopularCats' :{

                },
                'getActiveCampaigns' :{

                }
            };
            const [getPopularCats, getActiveCampaigns] = await Promise.all([thisObj.getPopularCats(req),thisObj.getActiveCampaigns(req)]);
            var apiFlg = '';
            var cntOfActiveCampaigns = 0;
            var cntOfPopularCats = 0;            
            if( helperFunc.undefNullEmptyCheck(getPopularCats) && helperFunc.undefNullEmptyCheck(getActiveCampaigns) ) {
                if( getPopularCats['errorCode'] == 1 ) {
                    myObj['getPopularCats']['errorCode'] = getPopularCats['errorCode'];
                    myObj['getPopularCats']['errorStatus'] = getPopularCats['errorStatus'];
                    apiFlg = 'getPopularCats';
                }else{
                    myObj['getPopularCats']['errorCode'] = getPopularCats['errorCode'];
                    myObj['getPopularCats']['errorStatus'] = getPopularCats['errorStatus'];                    
                }
                if( getActiveCampaigns['errorCode'] == 1 ) {
                    myObj['getActiveCampaigns']['errorCode'] = getActiveCampaigns['errorCode'];
                    myObj['getActiveCampaigns']['errorStatus'] = getActiveCampaigns['errorStatus'];
                    apiFlg = 'getActiveCampaigns';
                }else{
                    myObj['getActiveCampaigns']['errorCode'] = getActiveCampaigns['errorCode'];
                    myObj['getActiveCampaigns']['errorStatus'] = getActiveCampaigns['errorStatus'];                    
                }
                if( getPopularCats['errorCode'] == 1 && getActiveCampaigns['errorCode'] == 1) {
                    myObj['getActiveCampaigns']['errorCode'] = getActiveCampaigns['errorCode'];
                    myObj['getActiveCampaigns']['errorStatus'] = getActiveCampaigns['errorStatus'];
                    myObj['getPopularCats']['errorCode'] = getPopularCats['errorCode'];
                    myObj['getPopularCats']['errorStatus'] = getPopularCats['errorStatus'];
                    apiFlg = 'all';
                }
                if( getActiveCampaigns['errorCode'] == 0 ) {
                    cntOfActiveCampaigns = Object.keys(getActiveCampaigns['data']).length;
                }
                if( getPopularCats['errorCode'] == 0 ) {
                    cntOfPopularCats = Object.keys(getPopularCats['data']).length;
                }
                // parentid = "PXX22.XX22.161202130805.G2G8,PXX22.XX22.161202123754.G5L6,PXX22.XX22.190114125324.B1U7,PXX22.XX22.190108180007.L3U3,PXX22.XX22.181212124901.H8Z2,PXX22.XX22.181219182753.I4Y1,PXX22.XX22.181218161942.W6X9,PXX22.XX22.181214173514.X8Y6,PXX22.XX22.161107105225.C8P9,PXX22.XX22.150804192655.R8B8";
                parentid = parentid.replace(/,\s*$/, "");
                var splitParid = [];
                if( parentid.indexOf(",") > -1 ) {
                    var splitParid = parentid.split(',');
                }else{
                    splitParid.push(parentid);
                }
                if(apiFlg == 'all') {   
                    return res.status(200).send({data:{},errorCode:1,errorStatus:'Data Not Found'});
                }
                for( var i=0; i < splitParid.length; i++ ) {
                    myObj[splitParid[i]] = {'campaignName':'','campaignid':'','hotcategory':'','catName':'','parentid':splitParid[i]};                    
                    if( (cntOfPopularCats  > 0) ) {
                        // Loop thruogh cntOfPopularCats
                        Object.keys(getPopularCats['data']).map(function(key,val) {
                            if( getPopularCats['data'][key]['parentid'] == splitParid[i] ) {
                                myObj[splitParid[i]]['hotcategory'] = getPopularCats['data'][key]['hotcategory'];
                                myObj[splitParid[i]]['catName'] = getPopularCats['data'][key]['catName'];
                            }
                        });
                    }
                    if( cntOfActiveCampaigns > 0 ) {
                        // Loop thruogh cntOfActiveCampaigns
                        Object.keys(getActiveCampaigns['data']).map(function(key,val) {
                            if( getActiveCampaigns['data'][key]['parentid'] == splitParid[i] ) {
                                myObj[splitParid[i]]['campaignName'] = getActiveCampaigns['data'][key]['campaignName'];
                                myObj[splitParid[i]]['campaignid'] = getActiveCampaigns['data'][key]['campaignid'];
                            }
                        });
                    }
                }
                return res.status(200).send({data:myObj,errorCode:0,errorStatus:'Data Found'});            
            }else{
                return res.status(200).send({data:{},errorCode:1,errorStatus:'Data Not Found 111'});
            }
            // return res.status(200).send({splitParid,apiFlg,cntOfActiveCampaigns,cntOfActiveCampaigns,cntOfPopularCats,myObj,getPopularCats,getActiveCampaigns});
            // return res.status(200).send({getPopularCats,getActiveCampaigns});
        }catch(e) {
            retArr = {errorCode:1,errorStatus: e.stack};
            return res.status(500).send({retArr});
        }
    }
    async getOminitData(req,res) {
        var retObj = {};
        try {
            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retObj = {errorCode:1,errorStatus: "Data City is blank"};
                return res.status(400).send(retObj);
                
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.docid) ) {
                retObj = {errorCode:1,errorStatus: "docid is blank"};
                return res.status(400).send(retObj);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retObj = {errorCode:1,errorStatus: "parentid is blank"};
                return res.status(400).send(retObj);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
                retObj = {errorCode:1,errorStatus: "module is blank"};
                return res.status(400).send(retObj);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.empcode) ) {
                retObj = {errorCode:1,errorStatus: "empcode is blank"};
                return res.status(400).send(retObj);
            }
            var docidArr = [];
            var docid = req.body.docid.toString();
            docidArr.push(docid);
            var dataToSend = {};
            dataToSend[docid] = {
                data_city : req.body.data_city,
                parentid : req.body.parentid,
                module : req.body.module,
                empcode : req.body.empcode,
            }
            // docidArr.push("0731PX731.X731.130828131544.H1Q7");
            console.log("docidArr : ",docidArr);
            var curlTimeOut = {timeout:8000};
            var getOminiUrl = "http://www.jdomni.com/marketplace/static/php/web/service_api.php?action=omniContractInfo&from=shadow&docid="+JSON.stringify(docidArr)+"&data="+JSON.stringify(dataToSend);
            try{
                var errorcode = 0;
                var getOminiAPIResp = await curlObj.curlCall('xxx', getOminiUrl, {},'get',curlTimeOut);
                if( helperFunc.undefNullEmptyCheck(getOminiAPIResp) ) {
                    getOminiAPIResp = JSON.parse(getOminiAPIResp);
                }else{
                    errorcode = 1;
                    getOminiAPIResp = {};
                }
                if(errorcode == 1 ) {
                    retObj = {errorCode:1,errorStatus: 'Omini Data Not Found',data:getOminiAPIResp};
                }else{
                    retObj = {errorCode:0,errorStatus: 'Omini Data Found',data:getOminiAPIResp.data};

                }
                return res.status(200).send(retObj);
            }catch(e) {
                retObj = {errorCode:1,errorStatus: e};
                return res.status(500).send(retObj);
            }
        } catch(e) {
            retObj = {errorCode:1,errorStatus: e.stack};
            return res.status(500).send(retObj);
        }
    }
};
module.exports = CampaignDataClass;
