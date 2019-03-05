const usermodel = require('../models/contract.model.js');
const dbconfig = require("../../config/database.config.js");
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const helperFunc = require('../utility/helperFunc.js');
const md5 = require('md5');
const myObj = require('../utility/connect.mysql.js');
const os = require('os');
const mom = require('moment');
const verifier = require('email-verify');
const infoCodes = verifier.verifyCodes;

class LocationDataClass {
    async getStateInter(req) {
        var retArr = {};
        if ( !req.body.data_city || (req.body.data_city && req.body.data_city == "") ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            // return res.status(400).send({errorCode:0,errorStatus: "Data City is blank"});
            return retArr;
        }
        if ( !req.body.countrycode || (req.body.countrycode && req.body.countrycode == "") ) {
            retArr = {errorCode:1,errorStatus: "Country code Not found"};
            // return res.status(400).send({errorCode:0,errorStatus: "Country code Not found"});
            return retArr;
        }
        var cityConnect = "";
        if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
            cityConnect =   "remote";
        } else {
            cityConnect =   req.body.data_city.toLowerCase();
        }
        
        retArr = {
            data : {},
            errorCode : 1,
            errorStatus : 'Data Not found'
        };
        try {
            var dbParamIdc = dbconfig['idc'][cityConnect];    
            var mysqlObjIdc = new myObj(dbParamIdc);
            var sel_state_list = await mysqlObjIdc.query("SELECT DISTINCT st_name, state_id FROM state_master WHERE country_id = '"+req.body.countrycode+"' ORDER by st_name");
            if( sel_state_list.length > 0 ){
                var myArr = sel_state_list;
                retArr['data'] = myArr;
                retArr['errorCode'] = 0;
                retArr['errorStatus'] = 'Data found';
            }
        }catch(e){
            retArr = {
                errorCode : 1,
                errorStatus : 'Data Not found'
            };            
        }
        return retArr;
    }
    async getPincodeInter (req){
        var retArr = {};
        if ( !req.body.data_city || (req.body.data_city && req.body.data_city == "") ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            return retArr;
        }
        var city_code = "";
        var area_code = "";

        var cityCond = "";
        var condition = "";
        var limitFlag = "";
        if( typeof req.body.city !== 'undefined' && (req.body.city && req.body.city != "") ){
            city_code = req.body.city.toLowerCase();
            cityCond = " (data_city = '" + city_code.toUpperCase() + "' || city = '" + city_code.toUpperCase() + "') AND ";
        }
        if( typeof req.body.state !== 'undefined' && (req.body.state && req.body.state != "") ){
            cityCond += " state='"+req.body.state+"' AND ";
        }

        if( !req.body.area || (req.body.area && req.body.area == "") ){
            area_code = "";
        }else{
            area_code = req.body.area.toLowerCase();
        }
        if ( !req.body.pin_auto || (req.body.pin_auto && req.body.pin_auto == "") ) {
            condition = "";
            limitFlag = "";
        }else{
            condition = "pincode LIKE '"+req.body.pin_auto+"%' AND";
            limitFlag = 'LIMIT 10';
        }


        var cityConnect = "";
        if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
            cityConnect = "remote";
        } else {
            cityConnect = req.body.data_city.toLowerCase();
        }
        retArr = {
            errorCode : 1,
            errorStatus : 'Data Not found',
            pincode_count : 0
        };
        try {
            var dbParamIdc = dbconfig['idc'][cityConnect];
            var mysqlObjIdc = new myObj(dbParamIdc);
            var getPincodeListQr = "";
            if(area_code == ""){
                getPincodeListQr = "SELECT DISTINCT pincode,city FROM  tbl_areamaster_consolidated_v3 WHERE "+condition+" "+cityCond+" display_flag =1 AND type_flag=1 AND pincode IS NOT NULL ORDER BY pincode "+limitFlag+"";
            }else{
                getPincodeListQr =  "SELECT DISTINCT pincode,city FROM  tbl_areamaster_consolidated_v3 WHERE "+$condition+" "+cityCond+" areaname like '%"+area_code+"%' and display_flag =1 AND type_flag=1 AND pincode IS NOT NULL ORDER BY pincode "+limitFlag+"";
            }
            var pincode_list = await mysqlObjIdc.query(getPincodeListQr);
            if( pincode_list.length > 0 ){
                // let myArr = pincode_list;
                let myArr = [];

                pincode_list.map( (val,key) =>{
                    myArr.push(val['pincode']);
                });
                retArr = myArr;
                retArr['errorCode'] = 0;
                retArr['errorStatus'] = 'Data found';
                retArr['pincode_count'] = pincode_list.length;
            }
        }catch(e){
            retArr = {
                errorCode : 1,
                errorStatus : 'Data Not found',
                pincode_count : 0
            };
        }
        return retArr;
       
    }

    async pincode_master (req,res) {
        var postObj = {
            body:{}
        };
        postObj['body'] = req.body;
        var pincodeRespObj = await this.getPincodeInter(postObj);
        var retArr = {};
        if( typeof pincodeRespObj === 'undefined' || (!pincodeRespObj && pincodeRespObj == "") ){
            return res.status(400).send({errorCode:1,errorStatus: "Data Not Found"});
        }else{
            retArr = pincodeRespObj;
            if(pincodeRespObj['errorCode'] == 1){
                return res.status(400).send({errorCode: retArr['errorCode'],errorStatus: retArr['errorStatus'],data:{},pincode_count:0});
            }else{
                return res.status(200).send({ errorCode: 0, errorStatus: 'data found',data:retArr,pincode_count:pincodeRespObj['pincode_count'] });
            }
        }
    };


    async getState(req,res){
        var stateRespObj = await this.getStateInter(req);
        var retArr = {};
        if( typeof stateRespObj === 'undefined' || (!stateRespObj && stateRespObj == "") ){
            return res.status(400).send({errorCode:1,errorStatus: "Data Not Found"});
        }else{
            retArr = stateRespObj;
            if(stateRespObj['errorCode'] == 1){
                return res.status(400).send({errorCode: retArr['errorCode'],errorStatus: retArr['errorStatus'],data:{}});
            }else{
                res.status(200).send({ errorCode: 0, errorStatus: 'data found',data:retArr });
            }
        }
    };
    async getCityInter(req){
        var retArr = {};
        if ( !req.body.data_city || (req.body.data_city && req.body.data_city == "") ) {
            retArr = {errorCode:1,errorStatus: "Data City is blank"};
            return retArr;            
        }
        var state_code = req.body.state_code;//1212
        if( typeof state_code !== 'undefined' && state_code) {
            state_code = helperFunc.stripslashes(state_code);
            state_code = helperFunc.addslashes(state_code);
        }

        var data_city  = req.body.city;
        if( typeof data_city !== 'undefined' && data_city) {
            data_city = helperFunc.stripslashes(data_city);
            data_city = helperFunc.addslashes(data_city);
        }

        var search_str = req.body.search_str;//m
        if( typeof search_str !== 'undefined' && search_str) {
            search_str = helperFunc.stripslashes(search_str);
            search_str = helperFunc.addslashes(search_str);
        }
        var limit = '';
        var condition = "";
        var state_flag = 0;
		if( (!search_str || typeof search_str === 'undefined' || search_str == "") && (!data_city || typeof data_city === 'undefined' || data_city == '' ) && (!state_code || typeof state_code === 'undefined' || state_code == '' ) ) {
			condition = "";
		}else if( (typeof search_str === "undefined" || search_str == "") && ( !data_city || typeof data_city === 'undefined' || data_city == "") ){
			condition = "state_id =  '"+state_code+"' OR state_name ='"+state_code+"' AND";
		}else if ( (state_code == "" || typeof state_code === 'undefined') && (!data_city || typeof data_city === 'undefined' || data_city == "") ) {
			condition = "ct_name LIKE '"+search_str+"%' AND";
		}else if(typeof data_city !== 'undefined' && data_city != '') {
			state_flag = 1;
			condition = "main_city ='"+data_city+"' AND";
		}else{
			condition = "state_id = '"+state_code+"' OR state_name ='"+state_code+"' AND ct_name LIKE '"+search_str.toUpperCase()+"%' AND";
        }
        if( typeof search_str !== "undefined" && search_str != ""){
            limit = "LIMIT 10";
        }
        var cityConnect = "";
        if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
            cityConnect = "remote";
        } else {
            cityConnect = req.body.data_city.toLowerCase();
        }
        
        retArr = {
            data : {},
            errorCode : 1,
            errorStatus : 'Data Not found'
        };
        try {        
            var dbParamIdc = dbconfig['idc'][cityConnect];    
            var mysqlObjIdc = new myObj(dbParamIdc);
            var sel_city_list = "";
            if( state_flag == 1 ){
                sel_city_list = "SELECT ct_name, city_id,state_name,main_city FROM tbl_city_master WHERE "+condition+" DE_display=1 AND display_flag=1 AND ct_name != '' ORDER BY ct_name limit 1";
            }else{
                sel_city_list = "SELECT ct_name, city_id,state_name,main_city FROM tbl_city_master WHERE "+condition+" DE_display=1 AND display_flag=1 AND ct_name != '' ORDER BY ct_name "+limit+"";
            }
            var sel_city_list = await mysqlObjIdc.query(sel_city_list);
            if( sel_city_list.length > 0 ){
                var myArr = sel_city_list;
                // return myArr;
                retArr['data'] = myArr;
                retArr['errorCode'] = 0;
                retArr['errorStatus'] = 'Data found';
            }
        }catch(e){
            retArr = {
                errorCode : 1,
                errorStatus : 'Data Not found'
            };            
        }
        return retArr;
    };
    async getCity(req,res){
        var cityRespObj = await this.getCityInter(req);
        var retArr = {};
        if( typeof cityRespObj === 'undefined' || (!cityRespObj && cityRespObj == "") ){
            return res.status(400).send({errorCode:1,errorStatus: "Data Not Found"});
        }else{
            retArr = cityRespObj;
            if(cityRespObj['errorCode'] == 1){
                return res.status(400).send({errorCode: retArr['errorCode'],errorStatus: retArr['errorStatus'],data:{}});
            }else{
                res.status(200).send({ errorCode: 0, errorStatus: 'data found',data:retArr });
            }
        }
    };
    getContractInfoTable(req,res){
        var thisObj = this;
        if (!req.body.empcode || (req.body.empcode && req.body.empcode == "")) {
            return res.status(400).send({errorCode:1,errorStatus: "Employee code is blank"});
        }
        if (!req.body.data_city || (req.body.data_city && req.body.data_city == "")) {
            return res.status(400).send({errorCode:1,errorStatus: "Data City is blank"});
        }
        if (!req.body.parentid || (req.body.parentid && req.body.parentid == "")) {
            return res.status(400).send({errorCode:1,errorStatus: "parentid is blank"});
        }
        if (!req.body.module || (req.body.module && req.body.module == "")) {
            return res.status(400).send({errorCode:1,errorStatus: "module is blank"});
        }
        var completeData = (typeof req.body.allData !== 'undefined'  && (req.body.allData && req.body.allData != "")) ? req.body.allData : '';
        var parentid = req.body.parentid;
        var user_city = "";
        if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) > -1) {
            user_city   =   req.body.data_city.toLowerCase();
        } else {
            user_city   =   'remote';
        }
        var expParId = req.body.parentid.split("_");
        var postData = {};
        postData['data'] = {};
        postData['data']['empcode'] = req.body.empcode;
        postData['data']['parentid'] = parentid;
        postData['data']['data_city'] = req.body.data_city.toLowerCase();
        postData['data']['module'] = req.body.module.toUpperCase();
        var Module = req.body.module.toUpperCase();
        
        var headObj = {};
        var cityConnect = "";
        if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
            cityConnect =   "remote";
        } else {
            cityConnect =   req.body.data_city.toLowerCase();
        }
        var shadowInfo;
        var pinDataParamsObj = {
            body :{
                data_city : "",
                city : "",
                area : "",
                state : ""
            }
        };
        var cityDataParamsObj = {
            body :{
                state_code : ""
            }
        };
        var shadowDataPromise =   async () => {    
            // sdsdaf        
            var dbParamIdc = dbconfig['idc'][cityConnect];
            var mysqlObjIdc = new myObj(dbParamIdc);
            if(expParId[0] == "MAN"){
                try{
                    var findParId = await mysqlObjIdc.query("SELECT parentid FROM online_regis.tbl_man_camp_trans WHERE trans_id = '"+parentid+"'");
                    if(findParId.length > 0 ){
                        parentid = findParId[0]['parentid'];
                        let firstoccr = parentid.indexOf('P');
                        parentid = parentid.substr(firstoccr, parentid.length);
                        postData['data']['parentid'] =   parentid;
                    }
                } catch(err) {
                    res.status(500).send({ errorCode: 1, errorStatus: err.stack });
                }
            }
            try {
                var resCatidListPaid = "";
                var resCatidList = "";
                var completeCatArr = [];
                var completeCatResp = {
                    data :[],
                    catStatus : 'Categories Not Found',
                    catflag : 1
                }
                var paidCatArr = [];
                var nonPaidCatArr = [];
                var curlTimeOut = {timeout:8000};
                var getalldata = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/getalldata",postData,'post',{},curlTimeOut);
                getalldata = JSON.parse(getalldata);
                if( typeof getalldata['data'] !== 'undefined' && typeof getalldata['data']['tbl_business_temp_data'] !== 'undefined' &&  getalldata['data']['tbl_business_temp_data']) {
                    resCatidListPaid = (typeof getalldata['data']['tbl_business_temp_data']['catIds'] !== 'undefined' &&  getalldata['data']['tbl_business_temp_data']['catIds']!= "" && getalldata['data']['tbl_business_temp_data']['catIds']) ? getalldata['data']['tbl_business_temp_data']['catIds'] : "";
                    if(resCatidListPaid != ""){
                        paidCatArr = resCatidListPaid.split("|P|");
                        completeCatResp['catflag'] = 0;
                        completeCatResp['catStatus'] = 'Categories Found';
                    }
                }
                if( typeof getalldata['data'] !== 'undefined' && typeof getalldata['data']['tbl_companymaster_generalinfo_shadow'] !== 'undefined' && getalldata['data']['tbl_companymaster_generalinfo_shadow'] && getalldata['data'] ) {

                    resCatidList = ( typeof getalldata['data']['tbl_companymaster_extradetails_shadow']['catidlineage_nonpaid'] !== 'undefined' &&  getalldata['data']['tbl_companymaster_extradetails_shadow']['catidlineage_nonpaid'] != "" &&  getalldata['data']['tbl_companymaster_extradetails_shadow']['catidlineage_nonpaid'] ) ? getalldata['data']['tbl_companymaster_extradetails_shadow']['catidlineage_nonpaid'] : "";

                    if(resCatidList != "") {
                        resCatidList = resCatidList.substr(1,resCatidList.length-2);
                        nonPaidCatArr = resCatidList.split("/,/");
                        completeCatResp['catflag'] = 0;
                        completeCatResp['catStatus'] = 'Categories Found';
                    }
                    if( nonPaidCatArr.length > 0 || paidCatArr.length > 0 ) {
                        completeCatArr = nonPaidCatArr.concat(paidCatArr);
                        completeCatArr = completeCatArr.filter((v, i, a) => a.indexOf(v) === i);
                    }
                    if(completeCatArr.length > 0){
                        try {
                            var dbParamLocal = dbconfig['local'][cityConnect];
                            var mysqlObjLocal = new myObj(dbParamLocal);
                            let finalCatStr = "";
                            completeCatArr.map( (x,y) =>{
                                finalCatStr += x+"','";
                            });
                            finalCatStr = finalCatStr.substr(0,finalCatStr.length-2);
                            var getCat = await mysqlObjLocal.query("SELECT distinct(category_name),catid FROM tbl_categorymaster_generalinfo WHERE catid IN ('"+(finalCatStr)+") ORDER BY callcount DESC");
                            if ( getCat.length > 0 ) {
                                completeCatResp['data'] = getCat;
                                completeCatResp['catflag'] = 0;
                                completeCatResp['catStatus'] = 'Categories Found';
                            } else {
                                completeCatResp['catflag'] = 1;
                                completeCatResp['catStatus'] = 'Categories Not Found';
                            }
                        } catch(e) {
                            completeCatResp['catflag'] = 1;
                            completeCatResp['catStatus'] = 'Categories Not Found';
                            completeCatResp['errorStatus'] = e.stack;
                            return res.status(500).send(completeCatResp);
                        }
                    }
                    if( typeof getalldata['data']['tbl_companymaster_extradetails_shadow']['employee_info'] !== 'undefined' &&  getalldata['data']['tbl_companymaster_extradetails_shadow']['employee_info'] ){
                        getalldata['data']['tbl_companymaster_extradetails_shadow']['employee_info'] = JSON.parse(getalldata['data']['tbl_companymaster_extradetails_shadow']['employee_info']);
                    }else{
                        getalldata['data']['tbl_companymaster_extradetails_shadow']['employee_info'] = "";
                    }
                    let tbl_companymaster_extradetails_shadow = getalldata['data']['tbl_companymaster_extradetails_shadow'];
                    let tbl_companymaster_generalinfo_shadow = getalldata['data']['tbl_companymaster_generalinfo_shadow'];
                    shadowInfo = Object.assign(tbl_companymaster_generalinfo_shadow,tbl_companymaster_extradetails_shadow);
                    shadowInfo['errorCode'] = 0;
                    shadowInfo['errorStatus'] = 'Data Found';

                    pinDataParamsObj['body']['data_city'] = req.body.data_city.toLowerCase();

                    pinDataParamsObj['body']['city'] = (shadowInfo['city'] !== 'undefined' && shadowInfo['city'] != "" && shadowInfo['city']) ? shadowInfo['city'].toLowerCase() : "";

                    pinDataParamsObj['body']['area'] = (shadowInfo['area'] !== 'undefined' && shadowInfo['area'] != "" && shadowInfo['area']) ? shadowInfo['area'].toLowerCase() : "";

                    pinDataParamsObj['body']['state'] = (shadowInfo['state'] !== 'undefined' && shadowInfo['state'] != "" && shadowInfo['state']) ? shadowInfo['state'].toLowerCase() : "";

                    cityDataParamsObj['body']['state_code'] = (shadowInfo['state'] !== 'undefined' && shadowInfo['state'] != "" && shadowInfo['state']) ? shadowInfo['state'].toLowerCase() : "";
                    cityDataParamsObj['body']['countrycode'] = 98;

                    cityDataParamsObj['body']['data_city'] = req.body.data_city.toLowerCase();
                }else{
                    var shadowInfo = {
                        errorCode : 1,
                        errorStatus : 'Data Not Found'
                    };
                    return shadowInfo;
                }
            } catch(err) {
                var shadowInfo = {
                    errorCode : 1,
                    errorStatus : err
                };
                return res.status(500).send(shadowInfo);
                // return shadowInfo;
            }
            var pincodeRespObj = {};
            var cityRespObj = {};
            if(typeof req.body.getAllData !== 'undefined' && req.body.getAllData != ""){
                pincodeRespObj = await thisObj.getPincodeInter(pinDataParamsObj);
                cityRespObj = await thisObj.getCityInter(cityDataParamsObj);
            }
            var retArr  =   {
                errorCode : shadowInfo['errorCode'],
                errorStatus : shadowInfo['errorStatus'],
                data :shadowInfo,
                pindata :{},
                citydata : {},
                cat_resp_temp :{},
                alternateChk : {},
                categoryChk : completeCatResp,
                restChk : {},
                retaur_check_temp :{}
            };
            retArr['pindata'] = pincodeRespObj;
            retArr['citydata'] = cityRespObj;
            retArr['awards_details'] = {};
            var award_details_arr_new = [];
            var award_selected = [];
            var award_rcv_from = [];
            var award_rcv_year = [];
            var award_desc = [];
            if(typeof shadowInfo['award'] !== 'undefined' && shadowInfo['award'] && shadowInfo['award'] != ''){
                award_details_arr_new = shadowInfo['award'].split("|~|");
                if(award_details_arr_new.length > 0){
                    for (var i = 0; i < award_details_arr_new.length; i++) {
                        if( typeof award_details_arr_new[i] !== 'undefined' && award_details_arr_new[i] != "" && award_details_arr_new[i] ) {
                            let awards_details_arr = award_details_arr_new[i].split("$#$");                        
                            award_selected.push(awards_details_arr[0]);
                            award_rcv_from.push(awards_details_arr[1]);
                            award_rcv_year.push(awards_details_arr[2]);
                            award_desc.push(awards_details_arr[3]);
                        }
                    }
                    var myArr = {};
                    myArr['awards_details'] = {};
                    myArr['awards_details'] = {
                        award_selected,
                        award_rcv_from,
                        award_rcv_year,
                        award_desc,
                    }
                    retArr['awards_details'] = myArr['awards_details'];
                }
            }else{
               var myArr = {};
                var award_selected = [];
                award_selected[0] = "";
                var award_rcv_from = [];
                award_rcv_from[0] = "";
                var award_rcv_year = [];
                award_rcv_year[0] = "";
                var award_desc = [];
                award_desc[0] = "";
                myArr['awards_details'] = {};
                myArr['awards_details'] = {
                    award_selected,
                    award_rcv_from,
                    award_rcv_year,
                    award_desc,
                }
                retArr['awards_details'] = myArr['awards_details'];
            }
            var testimonial_details_arr_new = [];
            var testimon_selected = [];
            var name_of_cust = [];
            retArr['testimonial_details'] = {};
            if(typeof shadowInfo['testimonial'] !== 'undefined' && shadowInfo['testimonial'] && shadowInfo['testimonial'] != ''){
                testimonial_details_arr_new = shadowInfo['testimonial'].split('|~|');
                if(testimonial_details_arr_new && testimonial_details_arr_new.length >0){
                    for (var i = 0; i < testimonial_details_arr_new.length; i++) {
                        if( typeof testimonial_details_arr_new[i] !== 'undefined' && testimonial_details_arr_new[i] != "" && testimonial_details_arr_new[i] ) {
                            let testimon_details_arr = testimonial_details_arr_new[i].split("$#$");
                            testimon_selected.push(testimon_details_arr[0]);
                            name_of_cust.push(testimon_details_arr[1]);
                        }
                    }
                    var myArr = {};
                    myArr['testimonial_details'] = {};
                    myArr['testimonial_details'] = {
                        testimon_selected,
                        name_of_cust
                    }
                    retArr['testimonial_details'] = myArr['testimonial_details'];
                }
            }else{
                var myArr = {};
                testimon_selected.push("");
                name_of_cust.push("");
                myArr['testimonial_details'] = {};
                myArr['testimonial_details'] = {
                    testimon_selected,
                    name_of_cust
                }
                retArr['testimonial_details'] = myArr['testimonial_details'];
            }
            if(typeof shadowInfo['mobile_admin'] === 'undefined' || shadowInfo['mobile_admin'].length < 10 ){
                retArr['data']['mobile_admin'] = "";
            }else{
                if( typeof shadowInfo['mobile_admin'] !== 'undefined' && shadowInfo['mobile_admin'] && shadowInfo['mobile_admin'] != "" ){
                    var mobile_admin_arr = shadowInfo['mobile_admin'].split(",");
                    var mobile_admin_str = "";
                    for(var i=0; i< mobile_admin_arr.length; i++){
                        if (mobile_admin_arr[i].length == 10 ){
                            mobile_admin_str += ','+mobile_admin_arr[i];
                        }
                    }
                    if(mobile_admin_str != ""){                    
                        mobile_admin_str = mobile_admin_str.replace(/^,|,$/g, '');
                        //mobile_admin_str.substr(1).slice(0, -1); // remove first and last comma from string
                        retArr['data']['mobile_admin'] = mobile_admin_str;
                    }
                }
            }
            if( typeof shadowInfo['proof_establishment'] !== 'undefined' && shadowInfo['proof_establishment'] && shadowInfo['proof_establishment'] != "" ){
                retArr['establish_details'] = {};
                var establish_details_arr = shadowInfo['proof_establishment'].split('$#$');
                retArr['establish_details']['selec_est_lic_num'] = establish_details_arr[0];
                retArr['establish_details']['comp_pan_num'] = establish_details_arr[1];
                retArr['establish_details']['llp_pan_num'] = establish_details_arr[2];
            }
            retArr['mobile'] = {data:[]};
            if( typeof shadowInfo['mobile'] !== 'undefined' && shadowInfo['mobile'] && shadowInfo['mobile'] != "" ){
                var mobileArr = shadowInfo['mobile'].split(',');
                var mobile_arr = {};
                mobile_arr['data'] = [];
                var mobFinArr = [];
                if(mobileArr.length > 0){
                    for(var i=0; i< mobileArr.length; i++){
                        var mob_str = mobileArr[i].replace("|", "");
                        mob_str = mob_str.replace("^","");
                        mob_str = mob_str.replace("~","");
                        var mobObj = {
                            mobile :"",
                            mobile_display :false,
                            mobile_feedback : false
                        };
                        mobObj['mobile'] = mob_str;
                        mobile_arr['data'].push(mobObj);
                    }
                    if(typeof shadowInfo['mobile_display'] !== "undefined" && shadowInfo['mobile_display'] != '') {
                        var mob_dispArr	= shadowInfo['mobile_display'].split(",");
                        for(var i=0; i < mob_dispArr.length;  i++) {
                            if( (mobile_arr['data'][i] && typeof mobile_arr['data'][i] !== "undefined") && (typeof mobile_arr['data'][i]['mobile_display'] !== 'undefined') ){
                                mobile_arr['data'][i]['mobile_display'] = true;
                            }
                        }
                    }else {
                        var mobileObj = {
                            mobile_display : false,
                        }
                        mobile_arr['data'].push(mobileObj);
                    }
                }else{
                    var mobileObj = {
                        mobile : "",
                        mobile_display : false,
                        mobile_feedback : false
                    }
                    mobile_arr['data'].push(mobileObj);
                    mobile_arr['data'].push(mobileObj);
                }
                if(shadowInfo['mobile_feedback'] && ( typeof shadowInfo['mobile_feedback'] !== 'undefined' && shadowInfo['mobile_feedback'] != '') ){
                    var mob_feedArr	= shadowInfo['mobile_feedback'].split(",");
                    var mobfeedArr = [];
                    for(var i=0; i < mob_feedArr.length; i++) {
                        if( (mobile_arr['data'][i] && typeof mobile_arr['data'][i] !== "undefined") && (typeof mobile_arr['data'][i]['mobile_feedback'] !== 'undefined') ){
                            mobile_arr['data'][i]['mobile_feedback'] = true;
                        }
                    }
                }else {
                    var mobileObj = {
                        mobile_feedback : false
                    }
                    mobile_arr['data'].push(mobileObj);
                    mobile_arr['data'].push(mobileObj);
                }
                retArr['mobile']['data'] = mobile_arr['data'];
            }else{
                var mobile_arr = {};
                mobile_arr['data'] = [];
                var mobileObj = {
                    mobile : "",
                    mobile_display : false,
                    mobile_feedback : false
                }
                mobile_arr['data'].push(mobileObj);
                mobile_arr['data'].push(mobileObj);
                retArr['mobile']['data'] = mobile_arr['data'];
            }
            retArr['landline'] = {data:[]};
            var landlineArr = [];
            var landline_exp = [];
            if ( shadowInfo['landline_addinfo'] && (shadowInfo['landline_addinfo'] != '' || shadowInfo['landline'] != '') ) {
                if (shadowInfo['landline_addinfo'] != '') {							
                    landline_exp = shadowInfo['landline_addinfo'].split('|~|');
                }else{
                    landline_exp = shadowInfo['landline'].split(',');
                }
            }
            if( landline_exp.length > 0 ){
                for(var i=0; i<landline_exp.length; i++) {
                    var completeLandline	=	landline_exp[i].split("|^|");
                    landlineArr.push(completeLandline);
                }
                var landline_arr = {};
                landline_arr['data'] = [];
                for(var i=0; i < landlineArr.length; i++){
                    var landline_str = landlineArr[i][0].replace("|", "");
                    landline_str = landline_str.replace("^","");
                    landline_str = landline_str.replace("~","");
                    var landlineObj = {
                        landline :""
                    };
                    landlineObj['landline'] = landline_str;
                    landline_arr['data'].push(landlineObj);
                    if(landlineArr[i][1] != ''){
                        var landlineObjNew = {
                            landline_comment : ""
                        };
                        landlineObjNew['landline_comment'] = landlineArr[i][1];
                        landline_arr['data'].push(landlineObjNew);
                    }
                }
                retArr['landline']['data'] = landline_arr['data'];
            }else{
                var landline_arr = {};
                landline_arr['data'] = [];
                var landlineObj = {
                    landline :""
                };                
                landline_arr['data'].push(landlineObj);
                retArr['landline']['data'] = landline_arr['data'];
            }
            retArr['email'] = {data:[]};
            var emailObj = {};
            emailObj['data'] = [];
            if( shadowInfo['email'] && typeof shadowInfo['email'] !== 'undefined' && shadowInfo['email'] != '' ) {
                var emailArr = shadowInfo['email'].split(",");
                for(var i=0; i< emailArr.length; i++){
                    var emailTempObj = {
                        email : "",
                        email_display:false,
                        email_feedback:false
                    };
                    emailTempObj['email'] = emailArr[i];
                    emailObj['data'].push(emailTempObj);
                }
                if( shadowInfo['email_display'] && typeof shadowInfo['email_display'] !== 'undefined' && shadowInfo['email_display'] !='' ){
                    var email_display	=	shadowInfo['email_display'].split(",");
                    for(var i=0; i< email_display.length; i++ ){
                        if( (emailObj['data'][i] && typeof emailObj['data'][i] !== "undefined") && (typeof emailObj['data'][i]['email_display'] !== 'undefined') ){
                            emailObj['data'][i]['email_display'] = true;
                        }
                    }
                }else{                    
                    var myEmailObj = {
                        email_display : false,
                    }
                    shadowInfo['email_display'] = "";
                    emailObj['data'].push(myEmailObj);
                    emailObj['data'].push(myEmailObj);
                }
                if( shadowInfo['email_feedback'] && typeof shadowInfo['email_feedback'] !== 'undefined' && shadowInfo['email_feedback'] !='' ){
                    var email_feedback	=	shadowInfo['email_feedback'].split(",");
                    for(var i=0; i < email_feedback.length; i++ ) {
                        if( (emailObj['data'][i] && typeof emailObj['data'][i] !== "undefined") && (typeof emailObj['data'][i]['email_feedback'] !== 'undefined') ){
                            emailObj['data'][i]['email_feedback'] = true;
                        }
                        // emailObj['data'][0]['email_feedback'] = true;
                    }
                }else{
                    var myEmailObj = {
                        email_feedback : false,
                    }
                    shadowInfo['email_feedback'] = "";
                    emailObj['data'].push(myEmailObj);
                    emailObj['data'].push(myEmailObj);
                }
                retArr['email']['data'] = emailObj['data'];
                retArr['data'] = shadowInfo;
            }else{
                var myEmailObj = {
                    email : "",
                    email_feedback : "false",
                    email_display : "false",
                }
                emailObj['data'].push(myEmailObj);
                emailObj['data'].push(myEmailObj);                
                retArr['email']['data'] = emailObj['data'];
            }
            retArr['social_media_url'] = {data:{}};
            if( shadowInfo['social_media_url'] && typeof shadowInfo['social_media_url'] !== 'undefined' && shadowInfo['social_media_url'] !='' ){
                var social_media_url = shadowInfo['social_media_url'].split("|~|");
                var social_media_url_obj = {
                    social_media_url : []
                };
                social_media_url_obj['social_media_url'].push(social_media_url);
                retArr['social_media_url']['data'] = social_media_url_obj;
            }else{
                var social_media_url = [];
                social_media_url[0] = "";
                social_media_url[1] = "";
                var social_media_url_obj = {
                    social_media_url : []
                };
                social_media_url_obj['social_media_url'].push(social_media_url);
                retArr['social_media_url']['data'] = social_media_url_obj;
                retArr['social_media_url']['data']['ContactType'] = "NEWCONTACT";
            }
            retArr['otherCity'] = {data:0};
            retArr['per_data'] = {
                data:{
                    selected_salutation : [],
                    personName : [],
                    designation : []
                }
            };
            var selected_salutation = [];
            var selected_name = [];
            var selected_desig = [];
            if( shadowInfo['contact_person'] && (typeof shadowInfo['contact_person'] !== 'undefined') && shadowInfo['contact_person'] != "" ){
                if( shadowInfo['contact_person'].indexOf(',') > -1 ){
                    var completeName = shadowInfo['contact_person'].split(",");
                    for(var i=0 ;  i < completeName.length; i++){
                        var dataExp = completeName[i].split(" ");
                        selected_salutation.push(dataExp[0]);
                        var strNameDesig = "";
                        dataExp.map( (x,y) =>{
                            if(y != 0){
                                strNameDesig += x+" ";
                            }
                        });
                        strNameDesig = strNameDesig.substr(-(strNameDesig.length),(strNameDesig.length-1));
                        var strNameDesigArr = strNameDesig.split('(');
                        selected_name.push(strNameDesigArr[0]);
                        if(strNameDesigArr[1] && typeof strNameDesigArr[1] !== 'undefined') {
                            var selected_desig_str = strNameDesigArr[1].substr(-strNameDesigArr[1].length,(strNameDesigArr[1].length-1));
                            selected_desig.push(selected_desig_str);
                        }
                    }
                    retArr['per_data']['data']['selected_salutation'] = selected_salutation;
                    retArr['per_data']['data']['personName'] = selected_name;
                    retArr['per_data']['data']['designation'] = selected_desig;
                }else{
                    if( typeof shadowInfo['contact_person'] !== "undefined" && shadowInfo['contact_person'] != ""){
                        var dataExp = shadowInfo['contact_person'].split(" ");
                        selected_salutation.push(dataExp[0]);                        
                        var strNameDesig = "";
                        dataExp.map( (x,y) =>{
                            if(y != 0){
                                strNameDesig += x+" ";
                            }
                        });
                        strNameDesig = strNameDesig.substr(-(strNameDesig.length),(strNameDesig.length-1));
                        var strNameDesigArr = strNameDesig.split('(');
                        selected_name.push(strNameDesigArr[0]);
                        if( typeof strNameDesigArr[1] !== 'undefined' && strNameDesigArr[1] != "") {
                            var selected_desig_str = strNameDesigArr[1].substr(-strNameDesigArr[1].length,(strNameDesigArr[1].length-1));
                            selected_desig.push(selected_desig_str);
                        }else{
                            var selected_desig_str = "";
                            selected_desig.push(selected_desig_str);
                        }
                        
                        retArr['per_data']['data']['selected_salutation'] = selected_salutation;
                        retArr['per_data']['data']['personName'] = selected_name;
                        retArr['per_data']['data']['designation'] = selected_desig;                
                    }
                }
            }
            retArr['data_salute'] = ['Mr','Ms','Dr'];
            retArr['docid'] = {
                data : '',
                docStatus : 'DOCID NOT FOUND',
                docflag : 1
            };
            try {
                var dbParamIro = dbconfig['local'][cityConnect];
                var mysqlObjIro = new myObj(dbParamIro);
                var getDoc = await mysqlObjIro.query("SELECT docid,data_city FROM db_iro.tbl_id_generator WHERE parentid='"+postData['data']['parentid']+"'");
                if( getDoc.length > 0 ) {
                    shadowInfo['data_city'] = ( typeof getDoc[0]['data_city'] !== 'undefined' && getDoc[0]['data_city'] && getDoc[0]['data_city'] != "") ? getDoc[0]['data_city'] : shadowInfo['data_city'];
                    if(typeof getDoc[0]['data_city'] !== 'docid' && getDoc[0]['docid'] && getDoc[0]['docid'] != ""){
                        retArr['docid']['data'] = getDoc[0]['docid'];
                        retArr['docid']['docStatus'] = 'DOCID FOUND';
                        retArr['docid']['docflag'] = '0';
                    }
                }
            }catch(e){
                retArr['docid'] = {
                    data : '',
                    docStatus : 'DOCID NOT FOUND',
                    docflag : 1,
                    errorStatus : e.stack
                };
                return res.status(500).send(retArr['docid']);
            }
            return retArr;
        }
    
        async function getDispositionList() {
            var disposeArrObj = {
                data:{},
                dispStatus : 'Data Not Found',
                dispflag : 1,
                dispostionListType : 'ME'
            };
            var myNewObj = {};
            var cityConnect = "";
            if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
                cityConnect = "remote";
            } else {
                cityConnect = req.body.data_city.toLowerCase();
            }
            if ( Module == 'ME'  && req.body.bypass != 1) {
                var dbParamIdc = dbconfig['idc'][cityConnect]; 
                var mysqlObjIdc = new myObj(dbParamIdc);
                try{
                    var dispositionData = await mysqlObjIdc.query("SELECT disposition_name, disposition_value, optgroup, redirect_url, lite_red_flag, group_sort_order FROM online_regis.tbl_disposition_info WHERE display_flag = 1 order by optgroup desc ,group_sort_order asc");
                    if( dispositionData.length > 0 ) {
                        dispositionData.map( (data,key) => {
                            if(typeof myNewObj[data['optgroup']] === 'undefined') {
                                myNewObj[data['optgroup']] = [];
                            }
                            var newObj = {
                                disposition_name :'',
                                disposition_value :'',
                                redirect_url :'',
                                lite_red :''
                            };
                            newObj = {
                                disposition_name :data['disposition_name'],
                                disposition_value :data['disposition_value'],
                                redirect_url :data['redirect_url'],
                                lite_red :data['lite_red_flag']
                            };
                            myNewObj[data['optgroup']].push(newObj);
                        });
                        disposeArrObj['data'] = myNewObj;
                        disposeArrObj['dispStatus'] = 'Data Found';
                        disposeArrObj['dispflag'] = '0';
                    }
                    return disposeArrObj;
                }catch(e){
                    return res.status(500).send(disposeArrObj);
                }
            } else {
                try{
                    var curlTimeOut = {timeout:8000};
                    if (!req.body.allocid || (req.body.allocid && req.body.allocid == "")) {
                        return res.status(400).send({errorCode:1,errorStatus: "Allocid is blank"});
                    }
                    var dbParamLocal = dbconfig['local'][cityConnect];
                    var mysqlObjLocal = new myObj(dbParamLocal);
                    postData['data']['secondaryid'] = "";
                    try{
                        var findsecondayAllocId = await mysqlObjLocal.query("SELECT secondary_allocid FROM d_jds.mktgEmpMaster WHERE mktEmpCode = '"+req.body.empcode+"'");
                        if(findsecondayAllocId.length > 0 ){
                            postData['data']['secondaryid'] = findsecondayAllocId[0]['secondary_allocid'];
                        }
                    } catch(err) {
                        res.status(500).send({ errorCode: 1, errorStatus: err.stack });
                    }
                    postData['data']['allocid'] = ( (typeof req.body.allocid !== 'undefined' && req.body.allocid != "" ) ) ? req.body.allocid.toUpperCase() : "";
                    postData['data']['type'] = "disposition";
                    var IpAddress = "";
                    if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
                        IpAddress =   paths.remoteTmeNode;
                    } else {
                        let whichcity = req.body.data_city.toLowerCase()+'TmeNode';
                        IpAddress = paths[whichcity];
                    }
                    var dispositionData = await curlObj.curlCall('xxx', IpAddress+"/user/get-menudispostion-info",postData,'post',{},curlTimeOut);
                    dispositionData = JSON.parse(dispositionData);
                    disposeArrObj['data'] = ( typeof dispositionData['data'] !== 'undefined' && dispositionData['data']) ? dispositionData['data'] : {};
                    disposeArrObj['dispStatus'] = 'Data Found';
                    disposeArrObj['dispflag'] = '0';
                    disposeArrObj['dispostionListType'] = 'TME';
                    return disposeArrObj;
                }catch( err ) {
                    return res.status(500).send(disposeArrObj);
                }
            }
        };
        
        async function executeParallel() {
            try {
                if(typeof req.body.getAllData === 'undefined' || req.body.getAllData == ""){
                    const resp1 = await shadowDataPromise();                    
                    var retArr = {
                        tableData:{}
                    };
                    retArr['tableData'] = {
                        dispositionChk :{},
                        errorCode:0,
                        errorStatus:'Data Found'
                    };
                    retArr['tableData'] = resp1;
                    if( typeof resp1 !== 'undefined' && resp1.errorCode == 0 ){
                        const [disposeListObj] = await Promise.all([getDispositionList()]);                        
                        retArr['tableData']['dispositionChk'] = disposeListObj;
                    }
                }else{
                    var retArr = {stateData:{},cityData:{},tableData:{},pinData:{}};
                    var pinData = {
                        pincode_count : 0,
                        errorCode : 1,
                        errorStatus : 'Data Not Found',
                        data : {}
                    };
                    var stateParamsObj = {
                        body : {
                            countrycode : 98,
                            data_city : req.body.data_city.toLowerCase()
                        }
                    }
                    const resp1 = await shadowDataPromise();
                    if( typeof resp1 !== 'undefined' && resp1.errorCode == 0 ) {
                        const [stateObj, disposeListObj] = await Promise.all([thisObj.getStateInter(stateParamsObj),getDispositionList()]);
                        if( (typeof resp1['pindata'] !== 'undefined') ) {
                            pinData['data'] = resp1['pindata'];
                            pinData['pincode_count'] = (typeof resp1['pindata'] !== 'undefined') ?  resp1['pindata']['pincode_count'] : 0 ;
                            pinData['errorCode'] = resp1['pindata']['errorCode'];
                            pinData['errorStatus'] = resp1['pindata']['errorStatus'];
                        }
                        retArr['stateData'] = stateObj;
                        retArr['cityData'] = resp1['citydata'];
                        retArr['pinData'] = pinData;
                        retArr['tableData'] = {
                            dispositionChk :{}
                        };
                        retArr['tableData'] = resp1;
                        retArr['tableData']['dispositionChk'] = disposeListObj;
                        delete resp1['pindata'];
                        delete resp1['citydata'];
                    }else {
                        retArr['tableData'] = resp1;
                        retArr['tableData'] = {
                            dispositionChk :{},
                            errorCode:1,
                            errorStatus:'Data Not Found'
                        };
                    }                    
                }
                res.status(200).send(retArr);
            } catch(err) {
                return res.status(500).send({ errorCode: 1, errorStatus: err.stack });
            }
        }
        executeParallel();
    };
    async insert_company_generalinfo(req,res) {
        // console.log(req.body);
        var thisObj = this;        
        var parentid = "";
        var empcode = "";
        var data_city = "";
        var module = "ME";
        var docid = "";
        var thisObj = this;

        try {
            if( ( !req.body.dataSend || typeof req.body.dataSend === 'undefined' ) || ( req.body.dataSend && req.body.dataSend == "" ) ){
                return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly dataSend"});
            }
            
            // var allData = JSON.parse(req.body.dataSend);  // commented purposefully
            var allData = (req.body.dataSend);
            // console.log(typeof allData.url);

            var PagePath = ( (typeof allData.url === "undefined") || ( typeof allData.url.href === "undefined" || !allData.url.href ) || ( allData.url.href && allData.url.href == "" ) ) ? "" : allData.url.href;
            
            // var PagePath = "";

            var listOfPathsForEmailValid = ["contact","owner","employee","verify-info"];
            
            var allowEmailValid = false;
            for (var i=0; i<listOfPathsForEmailValid.length;i++ ) {
                console.log("listOfPathsForEmailValid[i] --->",listOfPathsForEmailValid[i]);
                if(PagePath != ""){
                    if( PagePath.indexOf(listOfPathsForEmailValid[i]) > -1 ) {
                        allowEmailValid = true;
                        break;
                    }
                }
            }            
            // allowEmailValid

            
            if( ( !allData.bformData || typeof allData.bformData === 'undefined' ) || ( allData.bformData && allData.bformData == "" ) ) {
                return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly bformData"});
            }
    
            parentid = ( ( typeof allData.bformData.parentid === "undefined" || !allData.bformData.parentid ) || ( allData.bformData.parentid && allData.bformData.parentid == "" ) ) ? "" : allData.bformData.parentid;
    
            empcode = ( ( typeof allData.bformData.empCode === "undefined" || !allData.bformData.empCode) || ( allData.bformData.empCode && allData.bformData.empCode == "" ) ) ? "" : allData.bformData.empCode;
    
            docid = ( ( typeof allData.bformData.docid === "undefined" || !allData.bformData.docid ) || ( allData.bformData.docid && allData.bformData.docid == "" ) ) ? "" : allData.bformData.docid;
    
            data_city = ( ( typeof allData.data_city === "undefined" || !allData.data_city ) || ( allData.data_city && allData.data_city == "" ) ) ? "" : allData.data_city;
    
            if ( !empcode || (empcode && empcode == "") ) {
                return res.status(400).send({errorCode:1,errorStatus: "Employee code is blank"});
            }
            if ( !data_city || (data_city && data_city == "") ) {
                return res.status(400).send({errorCode:1,errorStatus: "Data City is blank"});
            }
            if ( !parentid || (parentid && parentid == "") ) {
                return res.status(400).send({errorCode:1,errorStatus: "parentid is blank"});
            }
            if ( !module || (module && module == "") ) {
                return res.status(400).send({errorCode:1,errorStatus: "module is blank"});
            }
    
            var location_form_info = {};
            if( (typeof allData.bformData.location_form_info !== 'undefined') && ( Object.keys(allData.bformData.location_form_info).length !== 0) ) {
                location_form_info = allData.bformData.location_form_info;
            }
            if ( location_form_info.length == 0 ) {
                return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly location_form_info"});
            }
            var contact_form_info = {};
    
            if( (typeof allData.bformData.contact_form_info !== 'undefined') && ( Object.keys(allData.bformData.contact_form_info).length !== 0 ) ) {
                contact_form_info = allData.bformData.contact_form_info;
            }
    
            if ( contact_form_info.length == 0 ) {
                return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly contact_form_info"});
            }
    
            var hours_form_info = {};
    
            if( (typeof allData.bformData.hours_form_info !== 'undefined') && ( Object.keys(allData.bformData.hours_form_info).length !== 0) ) {
                hours_form_info = allData.bformData.hours_form_info;
            }
    
            if ( hours_form_info.length == 0 ) {
                return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly hours_form_info"});
            }
    
            var payment_form_info = {};
            
            if( (typeof allData.bformData.payment_form_info !== 'undefined') && ( Object.keys(allData.bformData.payment_form_info).length !== 0 ) ) {
                payment_form_info = allData.bformData.payment_form_info;
            }
    
            if ( payment_form_info.length == 0 ) {
                return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly payment_form_info"});
            }
    
            var business_form_info = {};
    
            if( (typeof allData.bformData.business_form_info !== 'undefined') && ( Object.keys(allData.bformData.business_form_info).length !== 0 ) ) {
                business_form_info = allData.bformData.business_form_info;
            }
    
            if ( business_form_info.length == 0 ) {
                return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly business_form_info"});
            }
    
            // var additional_info = {};
    
            if( (typeof allData.bformData.additional_info !== 'undefined') && allData.bformData.additional_info && ( Object.keys(allData.bformData.additional_info).length !== 0) ) {
                var additional_info = allData.bformData.additional_info;
            }else{
                var additional_info = "";
            }
            if( (typeof allData.bformData.additional_info !== 'undefined') && allData.bformData.additional_info && ( Object.keys(allData.bformData.additional_info).length == 1) ) {
                if( typeof allData.bformData.additional_info.owner !== 'undefined' && allData.bformData.additional_info.owner && (Object.keys(allData.bformData.additional_info.owner).length == 0) ) {
                    var additional_info = "";                    
                }
            }
            // if ( additional_info.length == 0 ) {
            //     return res.status(400).send({errorCode:1,errorStatus: "parameters not send properly additional_info"});
            // }
            
            contact_form_info = Object.assign(contact_form_info,business_form_info);
            
            var cityConnect = "";
            if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
                cityConnect =   "remote";
            } else {
                cityConnect =   data_city.toLowerCase();
            }
            // dfgsdfg
            var pincode_temp = ( typeof location_form_info['pincode'] !== 'undefined' && location_form_info['pincode']) ? location_form_info['pincode'] : "";
            var dbParamLocal = dbconfig['local'][cityConnect];
            var mysqlObjLocal = new myObj(dbParamLocal);
            var latitude = ( typeof location_form_info['latitude'] !== 'undefined' && location_form_info['latitude'] && location_form_info['latitude'] != "") ? location_form_info['latitude'] : 0;
            var longitude = ( typeof location_form_info['longitude'] !== 'undefined' && location_form_info['longitude'] && location_form_info['longitude'] != "") ? location_form_info['longitude'] : 0;
            if( location_form_info['latitude'] == 0 && location_form_info['longitude'] == 0 ) {
                var gen_arr = await mysqlObjLocal.query("SELECT pincode,street FROM db_iro.tbl_companymaster_generalinfo WHERE parentid = '"+parentid+"' ");
                if( gen_arr.length > 0 ) {
                    if( gen_arr[0]['pincode'] != "" && gen_arr[0]['pincode'] ) {
                        pincode_temp = gen_arr[0]['pincode'];
                    }
                    var mysqlObjLocalsec = new myObj(dbParamLocal);
                    var sql_master = await mysqlObjLocalsec.query("SELECT latitude_final,longitude_final,data_city as city FROM d_jds.tbl_areamaster_consolidated_v3 WHERE pincode = ('" +pincode_temp+ "') AND display_flag=1 AND type_flag=1 LIMIT 1");
                    if( sql_master.length > 0 ) {
                        if( Math.round(sql_master[0]['latitude_final']) != 0 && Math.round(sql_master[0]['longitude_final']) != 0 ) {
                            longitude = sql_master[0]['longitude_final'];
                            latitude = sql_master[0]['latitude_final'];
                        }else {
                            var mysqlObjLocalthird = new myObj(dbParamLocal);
                            var sqllatitudes = await mysqlObjLocalthird.query("SELECT DISTINCT latitude,longitude,city FROM d_jds.geocode_pincode_master WHERE pincode = ('" +pincode_temp+ "')");
                            if( sqllatitudes.length > 0 ) {
                                if( Math.round(sqllatitudes[0]['longitude']) != 0 && Math.round(sqllatitudes[0]['latitude']) != 0 ) {
                                    longitude = sqllatitudes[0]['longitude'];
                                    latitude = sqllatitudes[0]['latitude'];
                                }
                            }
                        }
                    }
                }
            }
            var street 	= ( typeof location_form_info['street'] !== 'undefined' && location_form_info['street']) ? location_form_info['street'] : "";
    
            var landmark = ( typeof location_form_info['landmark'] !== 'undefined' && location_form_info['landmark']) ? location_form_info['landmark'] : "";
    
            var city = ( typeof location_form_info['city'] !== 'undefined' && location_form_info['city']) ? location_form_info['city'] : "";
    
            var street = ( typeof location_form_info['street'] !== 'undefined' && location_form_info['street']) ? location_form_info['street'] : "";
    
            var bName =	( typeof contact_form_info['bName'] !== 'undefined' && contact_form_info['bName'] !== "") ? contact_form_info['bName'] : "";
    
            if ( bName == "" ) {
                return res.status(400).send({errorCode:1,errorStatus: "CompanyName is empty"});
            }
            
            var country_code = ( typeof location_form_info['country'] !== 'undefined' && location_form_info['country']) ? location_form_info['country'] : "";
            
            var state = ( typeof location_form_info['state'] !== 'undefined' && location_form_info['state']) ? location_form_info['state'] : "";
            
            var city = ( typeof location_form_info['city'] !== 'undefined' && location_form_info['city']) ? location_form_info['city'] : "";
            
            var area = ( typeof location_form_info['area'] !== 'undefined' && location_form_info['area']) ? location_form_info['area'] : "";
            
            var building_name = ( typeof location_form_info['building_name'] !== 'undefined' && location_form_info['building_name']) ? location_form_info['building_name'] : "";
            
            var subarea = ( typeof location_form_info['subarea'] !== 'undefined' && location_form_info['subarea']) ? location_form_info['subarea'] : "";
            
            var pincode  = ( typeof location_form_info['pincode'] !== 'undefined' && location_form_info['pincode']) ? location_form_info['pincode'] : "";
            
            if ( pincode == "" ) {
                return res.status(400).send({errorCode:1,errorStatus: "pincode is empty"});
            }

            var geocode_accuracy_level_param = ( typeof location_form_info['geocode_accuracy_level'] !== 'undefined' && location_form_info['geocode_accuracy_level']) ? location_form_info['geocode_accuracy_level'] : "";

            var accr_flag =	'';
            var accString = '';
            if(geocode_accuracy_level_param == 1){
                var geocode_accuracy_level = '1';
            }
            
            if(geocode_accuracy_level_param != 1) {

                var geocode_accuracy_level = '4';
                if ( landmark != "" ) {
                    accr_flag = '2';
                    var landmark_temp = landmark;
                    landmark_temp = helperFunc.stripslashes(landmark_temp);
                    landmark_temp = helperFunc.addslashes(landmark_temp);
                    // console.log("after---->",landmark);
                    accString = landmark_temp;
                    var dbParamLocal = dbconfig['local'][cityConnect];
                    var mysqlObjLocal = new myObj(dbParamLocal);
                    var accstr = await mysqlObjLocal.query("SELECT count(1) as accCount FROM tbl_areamaster_consolidated_v3 WHERE display_flag=1 AND city='"+city+"' AND main_area LIKE '%"+accString+"%' AND type_flag='"+accr_flag+"' ");
                        if ( accstr.length > 0 ) {
                            if ( accstr[0]['accCount'] > 0 ) {
                                geocode_accuracy_level = 2;
                            }else if ( street	!=	"" ) {
                                accr_flag =	'3';
                                var street_temp = street;
                                street_temp = helperFunc.stripslashes(street_temp);
                                street_temp = helperFunc.addslashes(street_temp);
                                accString =	street_temp;
                                var dbParamLocal = dbconfig['local'][cityConnect];
                                var mysqlObjLocalX = new myObj(dbParamLocal);
                                var accstr = await mysqlObjLocalX.query("SELECT count(1) as accCount FROM tbl_areamaster_consolidated_v3 WHERE display_flag=1 AND city='"+city+"' AND main_area LIKE '%"+accString+"%' AND type_flag='"+accr_flag+"' ");
                                if ( accstr.length > 0 ) {
                                    if ( accstr[0]['accCount'] > 0 ) {
                                        geocode_accuracy_level 	=	'3';
                                    }
                                }
                            } 
                        }
                }else if ( street	!=	"" ) {
                    accr_flag =	'3';
                    var street_temp = street;
                    street_temp = helperFunc.stripslashes(street_temp);
                    street_temp = helperFunc.addslashes(street_temp);
                    accString =	street_temp;
                    var dbParamLocal = dbconfig['local'][cityConnect];
                    var mysqlObjLocalX = new myObj(dbParamLocal);
                    var accstr = await mysqlObjLocalX.query("SELECT count(1) as accCount FROM tbl_areamaster_consolidated_v3 WHERE display_flag=1 AND city='"+city+"' AND main_area LIKE '%"+accString+"%' AND type_flag='"+accr_flag+"' ");
                    if ( accstr.length > 0 ) {
                        if ( accstr[0]['accCount'] > 0 ) {
                            geocode_accuracy_level 	=	'3';
                        }
                    }
                }
            }
            var addrarray = [];
    
            if( landmark != "" ){
                addrarray.push(landmark.trim());
            }
    
            if( building_name != "" ) {
                addrarray.push(building_name.trim());
            }
    
            if( street != ""){
                addrarray.push(street.trim());
            }
    
            if( area != ""){
                addrarray.push(area.trim());
            }
    
            var fulladdress = "";
            var fulladdress = addrarray.join(",");
    
            fulladdress = fulladdress+"-"+pincode;
    
            var othercity_number = "";
            if ( typeof contact_form_info['Other_City_No'] !== 'undefined' && contact_form_info['Other_City_No'] ) {
                if ( contact_form_info['Other_City_No'].length > 0 ) {
                    for(var i=0; i < contact_form_info['Other_City_No'].length; i++) {
                        if ( typeof contact_form_info['Other_City_No'][i] !== 'undefined' && contact_form_info['Other_City_No'][i] && contact_form_info['Other_City_No'][i]['othercity_number'] !== 'undefined' && contact_form_info['Other_City_No'][i]['othercity_number'] && contact_form_info['Other_City_No'][i]['othercity_number'] != "" && typeof contact_form_info['Other_City_No'][i]['other_city_std_code'] !== 'undefined' && contact_form_info['Other_City_No'][i]['other_city_std_code'] && typeof contact_form_info['Other_City_No'][i]['other_city'] !== 'undefined' && contact_form_info['Other_City_No'][i]['other_city'] ) {
                            othercity_number += contact_form_info['Other_City_No'][i]['other_city']+"##"+'0'+contact_form_info['Other_City_No'][i]['other_city_std_code']+"##"+contact_form_info['Other_City_No'][i]['othercity_number']+",";
                        }else{
                            othercity_number += "";
                        }
                    }
                }
            }
            othercity_number = othercity_number.replace(/^,|,$/g, '');
    
            var person = "";
            if( typeof contact_form_info['person'] !== 'undefined' && contact_form_info['person'] ) {
                if ( contact_form_info['person'].length > 0 ) {
                    for (var i=0; i < contact_form_info['person'].length; i++ ) {
                        if( typeof contact_form_info['person'][i] !== 'undefined' && contact_form_info['person'][i] && typeof contact_form_info['person'][i]['ContactName'] !== 'undefined' && contact_form_info['person'][i]['ContactName'] && ( contact_form_info['person'][i]['ContactName'].trim() ) != "" ) {
                            if ( typeof contact_form_info['person'][i]['designation'] !== 'undefined' && contact_form_info['person'][i]['designation'] && contact_form_info['person'][i]['designation'].trim() != "" ) {
                                let salutation = ( typeof contact_form_info['person'][i]['salutation'] !== 'undefined' && contact_form_info['person'][i]['salutation'] ) ? contact_form_info['person'][i]['salutation'] : "";
                                person += salutation+" "+(contact_form_info['person'][i]['ContactName'].trim())+"("+contact_form_info['person'][i]['designation'].trim()+")"+",";
                            }else{
                                let salutation = ( typeof contact_form_info['person'][i]['salutation'] !== 'undefined' && contact_form_info['person'][i]['salutation'] ) ? contact_form_info['person'][i]['salutation'] : "";
                                person += salutation+" "+(contact_form_info['person'][i]['ContactName'].trim())+",";
                            }
                        }else{
                            if( typeof contact_form_info['person'][i] === 'undefined' || typeof contact_form_info['person'][i]['ContactName'] === 'undefined' ) {
                                person += "";
                            }
                        }
                    }
                }
            }
            person = person.replace(/^,|,$/g, '');
    
            var landline = "";
            var landline_lin_extra = "";
            var landline_display = "";
    
            if( typeof contact_form_info['landline'] !== 'undefined' && contact_form_info['landline'] ) {
                if ( contact_form_info['landline'].length > 0 ) {
                    for (var i=0; i < (contact_form_info['landline'].length) ; i++) {
    
                        if ( typeof contact_form_info['landline'][i] !== 'undefined' && contact_form_info['landline'][i] && typeof contact_form_info['landline'][i]['landline_display'] !== 'undefined' && contact_form_info['landline'][i]['landline_display'] != "" && contact_form_info['landline'][i]['landline_display'] ) {
                            landline_display += contact_form_info['landline'][i]['landline_display']+",";      
                        }else{
                            landline_display += "";
                        }
    
                        if( typeof contact_form_info['landline'][i] !== 'undefined' && contact_form_info['landline'][i] && typeof contact_form_info['landline'][i]['landline'] !== 'undefined' && contact_form_info['landline'][i]['landline'] !="" && contact_form_info['landline'][i]['landline'] ) {
                            landline += contact_form_info['landline'][i]['landline']+",";
    
                            let landlinecomments = ( typeof contact_form_info['landline'][i]['landlineComments'] !== 'undefined' && contact_form_info['landline'][i]['landlineComments'] && contact_form_info['landline'][i]['landlineComments'].trim() != "" ) ? contact_form_info['landline'][i]['landlineComments'] : "";
    
                            landline_lin_extra += contact_form_info['landline'][i]['landline']+"|^|"+landlinecomments+"|~|";
                        }
                    }
                }
                landline_display = landline_display.replace(/^,|,$/g, '');
                landline = landline.replace(/^,|,$/g, '');
                landline_lin_extra = landline_lin_extra.slice(0, -3); // Removing last three characters as it is delimeter
            }
            
            var mobile = "";
            var mobile_lin_extra = "";
            var mobile_display = "";
            var mobile_feedback = "";
            if( typeof contact_form_info['mobile'] !== 'undefined' && contact_form_info['mobile'] && contact_form_info['mobile'].length > 0 ) {
                for ( var i=0; i < contact_form_info['mobile'].length; i++) {
                    if (typeof contact_form_info['mobile'][i] !== 'undefined' && contact_form_info['mobile'][i] && contact_form_info['mobile'][i]['mobile'] !== '' && contact_form_info['mobile'][i]['mobile'] && ( contact_form_info['mobile'][i]['mobile'].length == 10 ) ) {
    
                        mobile += contact_form_info['mobile'][i]['mobile']+",";
                        mobile_lin_extra += contact_form_info['mobile'][i]['mobile']+'|^|'+'|~|';
                    }
                }
    
                if( typeof contact_form_info['mobilefeed'] !== 'undefined' && contact_form_info['mobilefeed'] ) {
                    for (var key in contact_form_info['mobilefeed']) {                    
                        if( typeof contact_form_info['mobilefeed'][key] !== 'undefined' && contact_form_info['mobilefeed'][key] ) {
                            if ( typeof contact_form_info['mobilefeed'][key]['mobile_display'] !== 'undefined' &&  contact_form_info['mobilefeed'][key]['mobile_display'] != "" && contact_form_info['mobilefeed'][key]['mobile_display'] ) {
                                mobile_display  += contact_form_info['mobilefeed'][key]['mobile_display']+",";
                            }else{
                                mobile_display  += "";
                            }
                            if ( typeof contact_form_info['mobilefeed'][key]['mobile_feedback_by_sms'] !== 'undefined' && contact_form_info['mobilefeed'][key]['mobile_feedback_by_sms'] != "" && contact_form_info['mobilefeed'][key]['mobile_feedback_by_sms'] ) {
                                mobile_feedback  += contact_form_info['mobilefeed'][key]['mobile_feedback_by_sms']+",";
                            }else{
                                mobile_feedback  += "";
                            }
                        }
                    }
                }
            }
            mobile = mobile.replace(/^,|,$/g, '');
            mobile_display = mobile_display.replace(/^,|,$/g, '');
            mobile_feedback = mobile_feedback.replace(/^,|,$/g, '');
            mobile_lin_extra = mobile_lin_extra.slice(0, -3);
    
            var email = "";
            var email_display = "";
            var notify_via_email = "";
    
            if ( typeof contact_form_info['email'] !== 'undefined' && contact_form_info['email'] && contact_form_info['email'].length > 0 ) {
                for(var i=0; i< contact_form_info['email'].length; i++ ) {
                    if ( typeof contact_form_info['email'][i] !== 'undefined' && contact_form_info['email'][i] && typeof contact_form_info['email'][i]['email'] !== 'undefined' && contact_form_info['email'][i]['email'] != "" && contact_form_info['email'][i]['email'] ) {

                        if (/@gmail.com\s*$/.test(contact_form_info['email'][i]['email']) && allowEmailValid) {
                            try{
                                var verifyEmailResp = await thisObj.verifyEmail(contact_form_info['email'][i]['email']);                                
                            }catch(error){
                                var retArr = {
                                    errorCode : error.errorCode,
                                    errorStatus : error.errorStatus
                                };
                                return res.status(200).send(retArr);
                            }
                        }
                        email += contact_form_info['email'][i]['email']+",";
                    }
                    if( typeof contact_form_info['email'][i] !== 'undefined' && contact_form_info['email'][i] && typeof contact_form_info['email'][i]['email_display'] !== 'undefined' && contact_form_info['email'][i]['email_display'] != "" && contact_form_info['email'][i]['email_display'] ) {
                        email_display += contact_form_info['email'][i]['email_display']+",";
                    }else{
                        email_display += '';
                    }
                    if( typeof contact_form_info['email'][i] !== 'undefined' && contact_form_info['email'][i] && typeof contact_form_info['email'][i]['notify_via_email'] !== 'undefined' && contact_form_info['email'][i]['notify_via_email'] != "" && contact_form_info['email'][i]['notify_via_email'] ) {
                        notify_via_email += contact_form_info['email'][i]['notify_via_email']+",";
                    }else{
                        notify_via_email += '';
                    }
                }
            }
            notify_via_email = notify_via_email.replace(/^,|,$/g, '');
            email_display = email_display.replace(/^,|,$/g, '');
            email = email.replace(/^,|,$/g, '');
    
            var website = '';
            if ( typeof contact_form_info['website'] !== 'undefined' && contact_form_info['website'] && contact_form_info['website'] != "" ) {
                for ( var key in contact_form_info['website'] ) {
                    if( typeof contact_form_info['website'][key] !== 'undefined' && contact_form_info['website'][key] && contact_form_info['website']!= "") {
                        website += contact_form_info['website'][key]+',';
                    }
                }
                website = website.replace(/^,|,$/g, '');
            } 
            var socialmediaurl = '';
            if ( typeof contact_form_info['socialMedia'] !== "undefined" && contact_form_info['socialMedia'] && contact_form_info['socialMedia'] != "" ) {
                socialmediaurl = contact_form_info['socialMedia'];
            }
    
            var fax	= "";
            if( typeof contact_form_info['fax'] !== "undefined" && contact_form_info['fax'] && contact_form_info['fax'].length > 0){
                for ( var i=0; i < contact_form_info['fax'].length ; i++) {
                    if ( typeof contact_form_info['fax'][i] !== "undefined" && contact_form_info['fax'][i] != "" && contact_form_info['fax'][i] ) {
                        fax += contact_form_info['fax'][i]+",";
                    }
                }
            }
            fax = fax.replace(/^,|,$/g, '');
    
            var tollfree = "";
            var tollfree_addinfo = "";
            if( typeof contact_form_info['tollfree'] !== "undefined" && contact_form_info['tollfree'] ) {
                for (var i=0; i < contact_form_info['tollfree'].length; i++) {
                    if ( typeof contact_form_info['tollfree'][i] !== "undefined" && contact_form_info['tollfree'][i] && contact_form_info['tollfree'][i]!= "" ) {
                        tollfree += contact_form_info['tollfree'][i]+",";
                        tollfree_addinfo += contact_form_info['tollfree'][i]+"|^|"+"|~|";
                    }
                }
            }
            tollfree = tollfree.replace(/^,|,$/g, '');
            tollfree_addinfo = tollfree_addinfo.slice(0, -3);
            
            var tollfree_display = "";
            if( typeof contact_form_info['tollfree_display'] !== "undefined" && contact_form_info['tollfree_display'] && (contact_form_info['tollfree_display'].length) > 0 ) {
                for (var i=0; i < contact_form_info['tollfree_display'].length; i++) {
                    if( typeof contact_form_info['tollfree_display'][i] !== "undefined" && contact_form_info['tollfree_display'][i] && contact_form_info['tollfree_display'][i] != "" ) {
                        tollfree_display += contact_form_info['tollfree_display'][i]+",";
                    }
                }
            }
            tollfree_display = tollfree_display.replace(/^,|,$/g, '');
    
            var short_code_msg = "";
            if( typeof contact_form_info['short_code_msg'] !== "undefined" && contact_form_info['short_code_msg'] && contact_form_info['short_code_msg'] != "") {
                short_code_msg 	= contact_form_info['short_code_msg'];
            }
            var std_code = ( typeof contact_form_info['std_code'] !== "undefined" && contact_form_info['std_code'] ) ? contact_form_info['std_code'] : "";
    
            var countryExtn = ( typeof contact_form_info['countryExtn'] !== "undefined" && contact_form_info['countryExtn'] ) ? contact_form_info['countryExtn'] : "";
            
            var working_time_start = ( typeof hours_form_info[0] !== "undefined" && hours_form_info[0] && typeof hours_form_info[0]['working_time_start'] !== "undefined" && hours_form_info[0]['working_time_start'] ) ? hours_form_info[0]['working_time_start'] : "";
    
            var working_time_end = ( typeof hours_form_info[1] !== "undefined" && hours_form_info[1] && typeof hours_form_info[1]['working_time_end'] !== "undefined" && hours_form_info[1]['working_time_end'] ) ? hours_form_info[1]['working_time_end'] : "";
    
            var payment_type = "";
    
            if( typeof payment_form_info['payment_type'] !== "undefined" && payment_form_info['payment_type'] && payment_form_info['payment_type'].length > 0 ) {
                for (var i=0; i < payment_form_info['payment_type'].length ; i++) {
                    if ( typeof payment_form_info['payment_type'][i] !== "undefined" && payment_form_info['payment_type'][i] ) {
                        payment_type += payment_form_info['payment_type'][i]+"~";
                    }
                }
            }
            payment_type = payment_type.slice(0, -1);
    
            var YOE = ( typeof contact_form_info['YOE'] !== "undefined" && contact_form_info['YOE'] ) ? contact_form_info['YOE'] : "";
            
            var tag_line = ( typeof contact_form_info['tag_line'] !== "undefined" && contact_form_info['tag_line'] ) ? contact_form_info['tag_line'] : "";
    
            var prefLang = ( typeof contact_form_info['prefLang'] !== "undefined" && contact_form_info['prefLang'] ) ? contact_form_info['prefLang'] : "";
    
            var date = mom(new Date()).format("YYYY-MM-DD HH:mm:ss");
    
            var mobile_admin = "";
            if( typeof contact_form_info['mobile_admin'] !== "undefined" && contact_form_info['mobile_admin'] && contact_form_info['mobile_admin']!= "" && typeof contact_form_info['mobile_admin'][0] !== "undefined" && contact_form_info['mobile_admin'][0] ) {
                for (var key in contact_form_info['mobile_admin'][0]) {
                    if ( contact_form_info['mobile_admin'][0].hasOwnProperty(key) && ( contact_form_info['mobile_admin'][0][key] != "" && contact_form_info['mobile_admin'][0][key] && contact_form_info['mobile_admin'][0][key].length == 10 ) ) {
                        mobile_admin +=	contact_form_info['mobile_admin'][0][key]+",";
                    }
                }
                mobile_admin = mobile_admin.replace(/^,|,$/g, '');
            }
    
            var param_gen = {
                updatedata:{
                    companyname:bName,
                    country:98,
                    area:area,
                    pincode:pincode,
                    state:state,
                    city:city,
                    display_city:city,
                    subarea:subarea,
                    building_name:building_name,
                    street:street,
                    landmark:landmark,
                    latitude:latitude,
                    longitude:longitude,
                    geocode_accuracy_level:geocode_accuracy_level,
                    full_address:fulladdress,
                    stdcode:std_code,
                    landline:landline,
                    landline_display:landline_display,
                    mobile:mobile,
                    mobile_display:mobile_display,
                    mobile_feedback:mobile_feedback,
                    mobile_feedback_nft:mobile_feedback,
                    tollfree:tollfree,
                    fax:fax,
                    tollfree_display:tollfree_display,
                    email:email,
                    email_display:email_display,
                    email_feedback:notify_via_email,
                    sms_scode: short_code_msg,
                    website : website,
                    contact_person : person,
                    contact_person_display : person,
                    othercity_number : othercity_number,
                    mobile_admin : mobile_admin,
                    data_city : data_city,
                }
            };
            var param_extra = {
                updatedata:{
                    companyname:bName,
                    landline_addinfo:landline_lin_extra,
                    mobile_addinfo : mobile_lin_extra,
                    tollfree_addinfo : tollfree_addinfo,
                    working_time_start : working_time_start,
                    working_time_end : working_time_end,
                    payment_type : payment_type,
                    year_establishment : YOE,
                    statement_flag : 0,
                    updatedBy : empcode,
                    updatedOn : date,
                    data_city : data_city,
                    social_media_url : socialmediaurl,
                    fb_prefered_language : prefLang,
                    tag_line : tag_line,
                    employee_info : JSON.stringify(additional_info)
                }
            }
            var param_intermediate = {
                updatedata:{
                    deactivate : 'N',
                    displayType : 'IRO~WEB~WIRELESS',
                    datesource : date,
                    facility_flag : 0
                }
            }
            var insertionObj = {
                data :{
                    parentid:parentid,
                    data_city:data_city,
                    module:"me",
                    table_data : JSON.stringify({tbl_companymaster_generalinfo_shadow : param_gen,
                        tbl_companymaster_extradetails_shadow: param_extra,
                        tbl_temp_intermediate:param_intermediate
                    })
                }
            };
            try{
                var curlTimeOut = {timeout:8000};
                var inertDataAPIResp = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/insertdata",insertionObj,'post',{},curlTimeOut);
                if( typeof inertDataAPIResp !== "undefined" ) {
                    inertDataAPIResp = JSON.parse(inertDataAPIResp);
                    if( inertDataAPIResp.error == 0 ) {
                        var retArr = {
                            errorCode : 0,
                            errorStatus : 'Data Inserted success'
                        };
                        var initVersionUrl = paths.jdboxurl+"/services/versioninit.php"+"?parentid="+parentid+"&data_city="+encodeURI(data_city)+"&usercode="+empcode+"&module=ME";
                        try {
                            var inertDataAPIResp = await curlObj.curlCall('xxx', initVersionUrl, {},'get',curlTimeOut);
                        }catch(err){
                            var retArr = {
                                errorCode : 1,
                                errorStatus : 'Data Insertion Failed'
                            };
                            return res.status(500).send(retArr);
                        }
                        return res.status(200).send(retArr);
                    } else {
                        var retArr = {
                            errorCode : 1,
                            errorStatus : 'Data Insertion Failed'
                        };
                        return res.status(500).send(retArr);
                    }
                } else {
                    var retArr = {
                        errorCode : 1,
                        errorStatus : 'Data Insertion Failed'
                    };
                    return res.status(500).send(retArr);
                }
            }catch(err) {
                var retArr = {
                    errorCode : 1,
                    errorStatus : 'Data Insertion Failed 1 '+err
                };
                return res.status(500).send(retArr);
            }
        }catch(err) {
            var retArr = {
                errorCode : 1,
                errorStatus : 'Data Insertion Failed 2 '+err.stack
            };
            return res.status(500).send(retArr);
            
        }

    };
    // Function to validate email
    verifyEmail(email) {
        return new Promise( (resolve,reject) => {
            verifier.verify(email, function( err, info ) {
                if( err ) {
                    console.log(err);
                    var retArr = {
                        errorCode : 1,
                        errorStatus : err
                    };
                    return reject(retArr);
                }
                else{
                    console.log( "Success (T/F): " + info.success );
                    console.log( "typeof info.success: " + typeof info.success );
                    if( !info.success ) {
                        console.log("in if of email");
                        var retArr = {
                            errorCode : 1,
                            errorStatus : info.info
                        };
                        return reject(retArr);
                    }else{
                        var retArr = {
                            errorCode : 0,
                            errorStatus :'Email is Valid'
                        };
                        return resolve(retArr);
                    }
                }
            });            
        });
    }
    async updTimingTo(req,res) {
        var parentid = "";
        var module = "";
        var ucode = "";
        var data_city = "";
        try{
            if( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                return res.status(400).send({errorCode:1,errorStatus: "parentid is not sent"});
            }
            parentid = req.body.parentid;
            if( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
                return res.status(400).send({errorCode:1,errorStatus: "module is not sent"});
            }
            module = req.body.module;
            if( !helperFunc.undefNullEmptyCheck(req.body.ucode) ) {
                return res.status(400).send({errorCode:1,errorStatus: "ucode is not sent"});
            }
            ucode = req.body.ucode;
            if( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                return res.status(400).send({errorCode:1,errorStatus: "data_city is not sent"});
            }
            data_city = req.body.data_city;
            var working_time_start = "Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-";
            var working_time_end = "Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-,Open 24 Hrs-";
            var param_extra = {
                updatedata:{
                    working_time_start : working_time_start,
                    working_time_end : working_time_end,
                }
            }
            var insertionObj = {
                data :{
                    parentid:parentid,
                    data_city:data_city,
                    module:module,
                    table_data : JSON.stringify({tbl_companymaster_extradetails_shadow: param_extra
                    })
                }
            };
            try{
                var curlTimeOut = {timeout:8000};
                var inertDataAPIResp = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/insertdata",insertionObj,'post',{},curlTimeOut);
                if( typeof inertDataAPIResp !== "undefined" ) {
                    inertDataAPIResp = JSON.parse(inertDataAPIResp);
                    if( inertDataAPIResp.error == 0 ) {
                        var retArr = {
                            errorCode : 0,
                            errorStatus : 'Data Inserted success'
                        };
                        return res.status(200).send(retArr);
                    } else {
                        var retArr = {
                            errorCode : 1,
                            errorStatus : 'Data Insertion Failed'
                        };
                        return res.status(500).send(retArr);
                    }
                } else {
                    var retArr = {
                        errorCode : 1,
                        errorStatus : 'Data Insertion Failed'
                    };
                    return res.status(500).send(retArr);
                }
            }catch(err) {
                var retArr = {
                    errorCode : 1,
                    errorStatus : 'Data Insertion Failed 1 '+err
                };
                return res.status(500).send(retArr);
            }
        }catch(e){
            return res.status(500).send({errorCode:1,errorStatus: e.stack});
        }
    }
    async getRatingsAPI(req,res) {
        var retArr = {};
        var parentid = "";
        var module = "";
        var ucode = "";
        var data_city = "";
        try {
            if( !helperFunc.undefNullEmptyCheck(req.body.paridStr) ) {
                retArr = {errorCode:1,errorStatus: "parentid is not sent"};
                return res.status(400).send(retArr);
            }
            parentid = req.body.paridStr;
            if( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "data_city is not sent"};
                return res.status(400).send(retArr);
            }
            data_city = req.body.data_city;
            var paridArr = [];
            parentid = parentid.replace(/,\s*$/, "");
            if( parentid.indexOf(",") > -1 ) {
                var splitParid = parentid.split(',');
                paridArr = splitParid;
            }else {
                paridArr.push(parentid);
            }
            var getRatingsParallel = async (parid,ucode,data_city,module) => {
                var resultArray = {};
                
                var parid = parid;
                var cityConnect = "";
                if(helperFunc.mainCityArr.indexOf(data_city.toLowerCase()) == -1) {
                    cityConnect =   "remote";
                } else {
                    cityConnect =   data_city.toLowerCase();
                }
                var paridSplit = parid.split("_");
                var dbParamIdc = dbconfig['idc'][cityConnect];
                var mysqlObjIdc = new myObj(dbParamIdc);
                if( paridSplit[0] == "MAN" ) {
                    try{
                        var findParId = await mysqlObjIdc.query("SELECT parentid FROM online_regis.tbl_man_camp_trans WHERE trans_id = '"+parid+"'");
                        if(findParId.length > 0 ){
                            parid = findParId[0]['parentid'];
                            let firstoccr = parid.indexOf('P');
                            parid = parid.substr(firstoccr, parid.length);
                        }
                    } catch(err) {
                        retArr.status(500).send({ errorCode: 1, errorStatus: err.stack });
                    }
                }                
                var dbParamFin = dbconfig['finance'][cityConnect];
                var mysqlObjFin = new myObj(dbParamFin);
                try {
                    var getPaidStatusQr = "SELECT parentid FROM db_finance.tbl_companymaster_finance WHERE parentid = '"+parid+"' AND balance > 0 LIMIT 1";
                    var getPaidStatusQr_resp = await mysqlObjFin.query(getPaidStatusQr);
                    var paid = 0;
                    if( getPaidStatusQr_resp.length > 0 ) {
                        paid = 1;
                    }
                } catch(err) {
                    res.status(500).send({ errorCode: 1, errorStatus: err.stack });
                }
                var dbParamLocal = dbconfig['local'][cityConnect];
                var mysqlObjLocal = new myObj(dbParamLocal);
                try {                
                    var getDocid = "SELECT docid FROM db_iro.tbl_id_generator WHERE parentid='"+parid+"' limit 1";
                    var getDocid_resp = await mysqlObjLocal.query(getDocid);
                    var docid = "";
                    if( getDocid_resp.length > 0 ) {
                        docid = getDocid_resp[0]['docid'];
                        resultArray[parid] = {};
                        resultArray[parid] = {
                            docid : docid,
                            image : "http://images.jdmagicbox.com/checkin/"+data_city.toLowerCase()+"/"+docid+".jpg"
                        }
                        var curlTimeOut = {timeout:8000};
                        try {
                            var RatingApiUrl =paths.RATINGS_API_URL+"?ct="+data_city+"&cid="+docid+"&paid="+paid+"&tab=&city="+data_city+"&passkey=776f2976458951eb71a22aceec0c1fcc";
                            var RatingApiUrlResp = await curlObj.curlCall('xxx', RatingApiUrl, {},'get',curlTimeOut);
                            if( helperFunc.undefNullEmptyCheck(RatingApiUrlResp) ) {
                                RatingApiUrlResp = JSON.parse(RatingApiUrlResp);
                                var overratpercent = RatingApiUrlResp['overratpercent'];
                                resultArray[parid]['rating'] = {};
                                resultArray[parid]['rating']['ratstar'] = RatingApiUrlResp['ratstar'];
                                resultArray[parid]['rating']['totrates'] = RatingApiUrlResp['totrates'];
                                var RatingTypeCount = 0;
                                var overratpercentLength = 0;
                                for (var key in overratpercent) {
                                    if (overratpercent.hasOwnProperty(key)) {
                                        overratpercentLength++;
                                        RatingTypeCount += overratpercent[key];                                        
                                    }
                                }
                                if( overratpercentLength > 0  && overratpercentLength <= 5 && RatingTypeCount > 0 ) {
                                    resultArray[parid]['rating']['errorCode'] = 0;
                                    resultArray[parid]['rating']['errorMsg'] = "Ratings found";
                                    resultArray[parid]['rating']['result'] = {
                                        totalRatings :RatingTypeCount,
                                        starCt:RatingApiUrlResp['totRatings']['stars'],
                                        star : RatingApiUrlResp['star'],
                                        errorCode : 0,
                                        errorMsg : "Data found"
                                    }
                                }else {
                                    resultArray[parid]['rating']['errorCode'] = 1;
                                    resultArray[parid]['rating']['errorMsg'] = "Ratings not available";
                                    resultArray[parid]['rating']['result'] = {
                                        totalRatings :0,
                                        starCt:RatingApiUrlResp['totRatings']['stars'],
                                        star : RatingApiUrlResp['star'],
                                        errorCode : 1,
                                        errorMsg : "Data not found"
                                    }
                                }
                            }else {
                                resultArray[parid]['rating'] = {};
                                resultArray[parid]['rating']['errorCode'] = 1;
                                resultArray[parid]['rating']['errorMsg'] = "Ratings not available";
                                resultArray[parid]['rating']['result'] = {
                                    totalRatings :0,
                                    starCt:0,
                                    star : 0,
                                    errorCode : 1,
                                    errorMsg : "Data not found"
                                }
                            }
                        } catch(err) {
                            var retArr = {errorCode : 1,errorStatus : err.stack};
                            return res.status(500).send(retArr);
                        }
                    }
                } catch(err) {
                    res.status(500).send({ errorCode: 1, errorStatus: err.stack });
                }
                return resultArray;
            }
            let PromisExecArr = [];            
            for ( var i= 0; i < paridArr.length; i++ ) {
                PromisExecArr.push(getRatingsParallel(paridArr[i],ucode,data_city,module));
            }
            var finalResp = await Promise.all(PromisExecArr);
            // Code to remove 0,1 i.e Default indexing and convert to a proper Object
            var resp = finalResp.reduce(function(result, item) {
                var key = Object.keys(item)[0]; //first property: a, b, c
                result[key] = item[key];
                return result;
            }, {});
            return res.status(200).send(resp);
        }catch(e) {
            retArr = {errorCode:1,errorStatus: e.stack}
            return res.status(500).send(retArr);
        }
    }
};
module.exports = LocationDataClass; 
