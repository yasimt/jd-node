const usermodel = require('../models/user.model.js');
const dbconfig = require("../../config/database.config.js");
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const helperFunc = require('../utility/helperFunc.js');
const md5 = require('md5');
const myObj = require('../utility/connect.mysql.js');
const os = require('os');
const mom = require('moment');
const envObj = require('../../config/env.conf.js');
const URLINFO = require(__basedir + "/common/geturl");

exports.getUserInfo =   (req,res) =>{
    if (!req.body.empcode || (req.body.empcode && req.body.empcode == "")) {
        return res.status(400).send({errorCode:0,errorMsg: "Employee code is blank"});
    }
    /* if (!req.body.data_city || (req.body.data_city && req.body.data_city == "")) {
        return res.status(400).send({errorCode:0,errorMsg: "Data City is blank"});
    } */
    
    var postData    			=   {};
    var postDatamongo    		=   {};
    postDatamongo['data'] 		= 	{};
    postData['empcode'] 		=   postDatamongo['data']['empcode']		=	req.body.empcode;
    postData['textSearch'] 		=   postDatamongo['data']['textSearch']		=	4;
    postData['reseller_flag'] 	=   postDatamongo['data']['reseller_flag']	=	1;
    postData['lin_update'] 		=   postDatamongo['data']['lin_update']		=	1;
    postData['isJson'] 			=   postDatamongo['data']['isJson']			=	1;
    var headObj =   {};
    headObj['auth_token'] =   md5("Q-ZedAP^I76A%'>j0~'z]&w7bR64{s");

    var cityConnect = "";
    if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
        cityConnect =   "remote";
    } else {
        cityConnect =   req.body.data_city.toLowerCase();
    }
    let empSSOInfo,empCityInfo;
    var employeePromise =   async function() {
        try {
			if(envObj.mongosso === 0){
				var getSSOInfo = await curlObj.curlCall('', paths.ssoapiurl+"api/getEmployee_xhr.php",postData,'xxx',headObj);
				empSSOInfo   =   JSON.parse(getSSOInfo);	
			}else{
				var getSSOInfo = await curlObj.curlCall("xxx", paths.ssoapiurlalternate+"api/employee/get-emp-data", postDatamongo, "post", {});
				empSSOInfo   =   JSON.parse(getSSOInfo);
			}
        } catch(err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
        var user_city = "";
        if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) > -1) {
            user_city   =   req.body.data_city;
        } else {
            user_city   =   empSSOInfo['data'][0]['city'];
        }
        var dbParam =   dbconfig['local'][cityConnect];
        var mysqlObj    =   new myObj(dbParam);
        try{
            var empCityInfo = await mysqlObj.query("SELECT ct_name,city_id,state_id,state_name,country_id,country_name FROM city_master where ct_name='"+user_city+"'");
        } catch(err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
        
        var retArr  =   {};
        retArr['results']   =   {};
        if(empSSOInfo['data'][0]['type_of_employee'] == 'tme' || empSSOInfo['data'][0]['type_of_employee'] == ''){
            retArr['results']['empType']                 		= 5;
        }else if(empSSOInfo['data'][0]['type_of_employee'] == 'me'){
            retArr['results']['empType']                 		= 3;
        }else if(empSSOInfo['data'][0]['type_of_employee'] == 'jda'){
            retArr['results']['empType']                 		= 13;
        }

        retArr['results']['allocid']			=	empSSOInfo['data'][0]['team_type'];
        retArr['results']['allocId']			=	empSSOInfo['data'][0]['team_type'];
        retArr['results']['S_EmpParentid']		=	empSSOInfo['data'][0]['reporting_head_code'];
        retArr['results']['S_UserName']  		= 	empSSOInfo['data'][0]['empname'];
        retArr['results']["uname"]       		= 	empSSOInfo['data'][0]['empname'];
        retArr['results']["ucode"]      		= 	empSSOInfo['data'][0]['empcode'];
        retArr['results']["empcode"]      		= 	empSSOInfo['data'][0]['empcode'];
        retArr['results']["empName"]            =   empSSOInfo['data'][0]['empname'];
        retArr['results']['mktgEmpCode'] 		= 	empSSOInfo['data'][0]['empcode'];
        retArr['results']['mktEmpCode'] 		= 	empSSOInfo['data'][0]['empcode'];
        retArr['results']['tme_mobile'] 		= 	empSSOInfo['data'][0]['mobile_num'];
        retArr['results']['status']     		= 	empSSOInfo['data'][0]['status'];
        retArr['results']['ipaddress']     	= 	"";

        retArr['results']['s_deptCountry_id'] 		= empCityInfo[0]['country_id'];
        retArr['results']['s_deptCountry'] 		= empCityInfo[0]['country_name'];
        retArr['results']['s_deptState_id'] 		= empCityInfo[0]['state_id'];
        retArr['results']['s_deptState'] 			= empCityInfo[0]['state_name'];
        retArr['results']['s_deptCity_id'] 		= empCityInfo[0]['city_id'];
        retArr['results']['s_deptCity'] 			= empCityInfo[0]['ct_name'];

        if (empSSOInfo['data'][0]['status']    ==  'ACTIVE') {
            retArr['results']['Approval_flag'] = 1;
        } else {
            retArr['results']['Approval_flag'] = 0;
        }
        

        retArr['hrInfo']    =   {};
        retArr['hrInfo']['data']    =   {};
        retArr['hrInfo']['data']['pro_pic_url']    =   "";
        retArr['hrInfo']['data']['empname']     = empSSOInfo['data'][0]['empname'];
        retArr['hrInfo']['data']['team_type']   = empSSOInfo['data'][0]['team_type'];
        retArr['hrInfo']['data']['reporting_head']   = empSSOInfo['data'][0]['reporting_head'];
        retArr['hrInfo']['data']['city']                = empSSOInfo['data'][0]['city'];
        retArr['hrInfo']['data']['email_id']                = empSSOInfo['data'][0]['email_id'];
        retArr['hrInfo']['data']['mobile_num']                = empSSOInfo['data'][0]['mobile_num'];
        retArr['hrInfo']['data']['designation']                = empSSOInfo['data'][0]['designation'];
            
        return retArr;
    }
    var dbParam =   dbconfig['local'][cityConnect];
    
    var mysqlObj    =   new myObj(dbParam);
    var getAllocTime    =   mysqlObj.query("SELECT alloc_time_slot FROM tbl_time_allocation");
    var mysqlObj    =   new myObj(dbParam);
    var getRowId    =   mysqlObj.query("SELECT rowId FROM mktgEmpMap WHERE mktEmpCode='"+req.body.empcode+"'");

    async function mktgEmpMaster() {
        
        try {
            var mysqlObj = new myObj(dbParam);
            var mktgEmpData = await mysqlObj.query("SELECT tmeClass,state,secondary_allocID,level,extn FROM mktgEmpMaster WHERE mktempcode = '"+req.body.empcode+"'");
        } catch(err2) {
            res.status(500).send({ errorCode: 1, errorMsg: err2.stack });
        }
        return mktgEmpData;
    }

    var mysqlObj    =   new myObj(dbParam);
    var currDate = mom(new Date()).format("YYYY-MM-DD")+" 00:00:00";
    
    var walkinClient    =   mysqlObj.query("SELECT parentid as contractid,companyname FROM d_jds.tbl_walkin_client_details WHERE tmecode = '"+req.body.empcode+"' AND (final_status = '' OR final_status IS NULL) AND allocated_date >= '"+currDate+"' GROUP BY parentid");

    async function executeParallel() {
        try {
            const [resp1, resp2, resp3, resp4, resp5] = await Promise.all([employeePromise(), getAllocTime, getRowId, mktgEmpMaster(),walkinClient]);
            var empCitySSOData     =   resp1; 
            
            var timeSlot     =  resp2[0]['alloc_time_slot'];
            var rowId        =  resp3[0]['rowId'];
            var mktgMaster = resp4[0];
            
            empCitySSOData['results']['extn'] 					= mktgMaster['extn'];
            empCitySSOData['results']['secondary_allocID'] 	= mktgMaster['secondary_allocID'];
            empCitySSOData['results']['tmeClass'] 				= mktgMaster['tmeClass'];
            empCitySSOData['results']['mktgEmpCls']  			= mktgMaster['tmeClass'];
            empCitySSOData['results']['level'] 				= mktgMaster['level'];
            empCitySSOData['results']['state'] 				= mktgMaster['state'];
            empCitySSOData['results']['time_slot'] 			= timeSlot;
            empCitySSOData['results']['mktgEmpRowId'] 			= rowId;
            
            if(mktgMaster['tmeClass'] == 4 && rowId == "") {
                empCitySSOData['results']['mktgEmpRowId'] 			= "O_"+req.body.empcode;
            }
            var walkinclient = resp5;
            empCitySSOData['client_waiting']    =   {};
            if(walkinclient.length > 0){
                empCitySSOData['client_waiting']['data'] =   walkinclient[0];
                empCitySSOData['client_waiting']['flag'] =   1;
            }else{
                empCitySSOData['client_waiting']['flag'] =   0;  
            }
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var ipExp   =  ip.split(":");
            empCitySSOData['remoteAddr'] 			= typeof ipExp[3] === 'undefined'?ipExp[0]:ipExp[3];
            
            var remote_city="";
            var header="";
            
            if(req.body.StationId && req.body.StationId!=''){
                var cityWhich = "";
                if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
                    cityWhich   =   "remote";
                }
                
                if(cityWhich == 'remote'){
                    remote_city	=	'remote_city';
                    header = "ctiMainPage.php?Pageno=1&city="+req.body.loginCity;
                }else{
                    header = "ctiMainPage.php?Pageno=1";
                }
            }else{
                header = "MainPage.php?Pageno=1";
            }
            
            empCitySSOData['results']['header'] =   header;
            
            empCitySSOData['results']['REMOTE_CITY_MODULE'] =   remote_city;
            var retArr  =   {};
            empCitySSOData['errorCode'] =   0;
            empCitySSOData['module'] 	=   'TME';
            
            retArr['errorCode']         =   0;
            retArr['errorStatus']       =   "Data Returned Successfully";
            retArr['data']              = empCitySSOData;  
            
            res.status(200).send(retArr);
        } catch(err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
        
    }
    executeParallel();
}

//////////////////////////////////////MENU-DISPOSITION Starts///////////////////////////////////////////////////

exports.getMenudispostionInfo =   (req,res) =>{
	if(!req.body.empcode || (req.body.empcode && req.body.empcode == "")){
		return res.status(400).send({ errorCode: 1, errorMsg: "Employee code is blank"})
	}
	/*if (!req.body.data_city || (req.body.data_city && req.body.data_city == "")) {
        	return res.status(400).send({errorCode:0,errorMsg: "Data City is blank"});
	}*/
    	if (!req.body.type || (req.body.type && req.body.type == "")) {
		return res.status(400).send({errorCode:0,errorMsg: "Request Type is blank"});
	}
	if (!req.body.allocid || (req.body.allocid && req.body.allocid == "")) {
        	return res.status(400).send({errorCode:0,errorMsg: "Allocid is blank"});
	}
	if (!req.body.tme_central || (req.body.tme_central && req.body.tme_central == "")) {
        	req.body.tme_central = 0;
	}else{
			req.body.tme_central = 1;
	}
    var cityConnect = "";
	if(helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
    	cityConnect =   "remote";
	} else {
    	cityConnect =   req.body.data_city.toLowerCase();
	}
	let url_info 			= 	URLINFO(cityConnect);
	var getmenuParallel = async (key,val,empcode,data_city) => {
			let res1 				= 	{};
			var dbParam 			=   dbconfig['local'][cityConnect];
			var dbParamIdc 			=   dbconfig['idconline'];
			res1['menu_id'] 		= 	val['menu_id'];
			res1['menu_name'] 		= 	val['menu_name'];
			res1['menu_link'] 		= 	val['menu_link'];
			res1['display_menu'] 	= 	val['display_menu'];
			res1['extraVals'] 		= 	val['extraVals'];
			res1['tme_central'] 	= 	val['tme_central'];
			if(val['tme_central'] == 1 && req.body.tme_central == 1){
				val['menu_link'] = val['menu_link'].substring(3);
				res1['menu_link']	=	url_info["tme_url"]+val['menu_link'];
			}else{
				res1['menu_link']	=	val['menu_link'];
			}
			if(val['menu_name'] == 'DIY JDRR prospect DATA'){
				var mysqlObjIDC    			=   new myObj(dbParamIdc);
				var JDRR_prospect_DATA_qr 	= 	await mysqlObjIDC.query("SELECT x1.*, x2.* FROM db_justdial_products.tbl_online_campaign x1, db_justdial_products.tbl_allocation_panindia_master x2 WHERE x1.docid = x2.docid AND allocated_flag=1 AND read_flag=0 AND empcode='"+empcode+"'");
				if(JDRR_prospect_DATA_qr.length > 0){
					res1['count'] = JDRR_prospect_DATA_qr.length;
				}else{
					res1['count'] = '';
				}
			}
			if(val['menu_id']	==	'47' || val['menu_id']	==	'48') {
				var mysqlObj    	=   new myObj(dbParam);
				var privilegeQry 	= 	await mysqlObj.query("SELECT * FROM tme_ecs_tracker_privilege WHERE tme_code='"+empcode+"' AND tme_status = 1");
				if(privilegeQry.length > 0){
					if(val['menu_id']	==	'47') {
						if(req.body.tme_central == 1 && val['tme_central'] == 1)
							var ecs_tracker_rpt_name = url_info["tme_url"]+'00_Payment_Rework/accounts/ecs_tracker_report.php?mode=2&me_tme=';
						else
							var ecs_tracker_rpt_name = '../00_Payment_Rework/accounts/ecs_tracker_report.php?mode=2&me_tme=';
					} else {
						if(req.body.tme_central == 1 && val['tme_central'] == 1)
							var ecs_tracker_rpt_name = url_info["tme_url"]+'00_Payment_Rework/accounts/si_tracker_report.php?mode=2&me_tme=';
						else
							var ecs_tracker_rpt_name = '../00_Payment_Rework/accounts/si_tracker_report.php?mode=2&me_tme=';
					}
				}else{
					if(val['menu_id']	==	'47') {
						if(req.body.tme_central == 1 && val['tme_central'] == 1)
							var ecs_tracker_rpt_name = url_info["tme_url"]+'00_Payment_Rework/accounts/ecs_tracker_report_tme.php?mode=2&me_tme=';
						else
							var ecs_tracker_rpt_name = '../00_Payment_Rework/accounts/ecs_tracker_report_tme.php?mode=2&me_tme=';
					} else {
						if(req.body.tme_central == 1 && val['tme_central'] == 1)
							var ecs_tracker_rpt_name = url_info["tme_url"]+'00_Payment_Rework/accounts/si_tracker_report_tme.php?mode=2&me_tme=';
						else
							var ecs_tracker_rpt_name = '../00_Payment_Rework/accounts/si_tracker_report_tme.php?mode=2&me_tme=';
					}
				}
				res1['menu_link']	=	ecs_tracker_rpt_name;
			}
			return res1;
	}
	
	var getmenu = async () => {
		try {
			if(req.body.type == "menu" || req.body.type == "both"){
				var retArr 			= {};
				var Maplinks 		= "";
				var sec_all 		= "";
				if(req.body.secondaryid!='' && req.body.secondaryid!= null){
					var secondArr	=  [];
					secondArr		=  req.body.secondaryid.split(",");
					secondArr.forEach(function(key,val){
						sec_all 	+= "'"+val+"',";
					});
					sec_all			=	sec_all.slice(0,-1);
					var allocids 	= 	"'"+req.body.allocid+"',"+sec_all;
				}else{
					var allocids	=  	"'"+req.body.allocid+"'";
				}		
				var dbParam 		=   dbconfig['local'][cityConnect];
				var mysqlObj    	=   new myObj(dbParam);		
				var mappedLink 		= 	await mysqlObj.query("SELECT link_name FROM tbl_team_mapping WHERE allocid in ("+allocids+")");
				var queryStr		=	'';
				queryStr			+=	" WHERE display_menu > 0";
				if(mappedLink.length > 0){
					mappedLink.forEach(function(key,val){
						Maplinks 	+= 	"'"+key['link_name']+"',";
					});
					Maplinks		=	Maplinks.slice(0,-1);
					queryStr		+=	" AND menu_name IN ("+Maplinks+")";
				}
				var res1			= 	{};
				res1['data']   		= 	{};
				var mysqlObj    	=   new myObj(dbParam);
                var getlinksname 	= 	await mysqlObj.query("SELECT menu_id,menu_name,menu_link,display_menu,extraVals,tme_central FROM tbl_menu_links "+queryStr);
                let PromisArr 		=   [];
                for (var val in getlinksname) {
                    PromisArr.push(getmenuParallel(val,getlinksname[val],req.body.empcode,req.body.data_city));
                }
				var totCount		=	0;
                var runlinks 		= await Promise.all(PromisArr);
				for (var val in runlinks){
					res1['data'][val] = {};
					res1['data'][val]['menu_id'] 		= runlinks[val]['menu_id'];
					res1['data'][val]['menu_name'] 		= runlinks[val]['menu_name'];
					res1['data'][val]['menu_link'] 		= runlinks[val]['menu_link'];
					res1['data'][val]['display_menu'] 	= runlinks[val]['display_menu'];
					res1['data'][val]['extraVals'] 		= runlinks[val]['extraVals'];
					res1['data'][val]['tme_central'] 		= runlinks[val]['tme_central'];
					totCount++;
				}
				var retObj 				= {};
				retObj['data'] 			= res1['data'];
				retObj['count'] 		= totCount;
				retObj['errorCode'] 	= 0;
				retObj['errorStatus'] 	= "Data Found";
				return retObj;
			}else{
				var retObj 				= {};
				retObj['errorCode'] 	= 1;
				retObj['errorStatus'] 	= "Not Menu Type";
				return retObj;
			}
		} catch(err) {
			return res.status(500).send({errorCode:1,errorStatus:err.stack});
		}
	}
    var getdispose = async () => {
		try {
			if(req.body.type == "disposition" || req.body.type == "both"){
				var retArr 			= {};
				var Maplinks 		= "";
				var sec_all 		= "";
				if(req.body.secondaryid!='' && req.body.secondaryid!= null){
					var secondArr	=  new Array();
					secondArr		=  req.body.secondaryid.split(",");
					secondArr.forEach(function(key,val){
						sec_all 	+= "'"+val+"',";
					});
					sec_all			=	sec_all.slice(0,-1);
					var allocids 	= "'"+req.body.allocid+"',"+sec_all;
				}else{
					var allocids	=  "'"+req.body.allocid+"'";
				}		
				var dbParam 		=   dbconfig['local'][cityConnect];
				var mysqlObj    	=   new myObj(dbParam);		
				var mappedLink 		= 	await mysqlObj.query("SELECT disposition_val from tbl_disposition_mapping where allocid in ("+allocids+")");
				
				if(mappedLink.length > 0){
					mappedLink.forEach(function(key,val){
						Maplinks 	+= "'"+key['disposition_val']+"',";
					});
					Maplinks		=	Maplinks.slice(0,-1);
					
				}
				var res1			= {};
				var dbParamIdc 		=   dbconfig['idconline'];
				var mysqlObj    	=   new myObj(dbParam);
				if(Maplinks == ''){
					var getlinksname 	= 	await mysqlObj.query("SELECT disposition_name,disposition_value,optgroup,redirect_url FROM d_jds.tbl_disposition_info where display_flag='1' order by optgroup_priority_flag");
				}else{
					var getlinksname 	= 	await mysqlObj.query("SELECT disposition_name,disposition_value,optgroup,redirect_url FROM tbl_disposition_info where disposition_value in ("+Maplinks+") ORDER BY optgroup_priority_flag AND display_flag='1'");
				}
				var totCount		=	0;
				for(var val in getlinksname){
					if (getlinksname[val]['optgroup'] in res1){
						res1[getlinksname[val]['optgroup']][totCount]	= getlinksname[val];
					}else{
						res1[getlinksname[val]['optgroup']]				= {};
						res1[getlinksname[val]['optgroup']][totCount]	= getlinksname[val];
					}
					if( getlinksname[val]['disposition_value'] == 22 || getlinksname[val]['disposition_value'] == 24 || getlinksname[val]['disposition_value'] == 25 || getlinksname[val]['disposition_value'] == 99 ){
						res1[getlinksname[val]['optgroup']][totCount]['lite_red'] = '1';
					}else{
						res1[getlinksname[val]['optgroup']][totCount]['lite_red'] = '0';
					}
					totCount++;
				}
				var retObj 				= {};
				retObj['data'] 			= res1;
				retObj['count'] 		= totCount;
				retObj['errorCode'] 	= 0;
				retObj['errorStatus'] 	= "Data Found";
				return retObj;
			}else{
				var retObj 				= {};
				retObj['errorCode'] 	= 1;
				retObj['errorStatus'] 	= "Not Disposition Type";
				return retObj;
			}
		} catch(err) {
			return res.status(500).send({errorCode:1,errorStatus:err.stack});
		}
	}
	var executeParallel = async ()=>{
        try{
            const [resp1,resp2] = await Promise.all([getmenu(),getdispose()]);
            var resultArr		=	{};
            if(resp1['errorCode'] == 0 && resp2['errorCode'] == 0){
				resultArr['menu']			=	resp1;
				resultArr['disposition']	=	resp2;
				res.status(200).send({data:resultArr,errorCode: 0,errorStatus:'Data Found'});
			}else if (resp1['errorCode'] == 0) {
				resultArr			=	resp1;
				res.status(200).send({data:resultArr.data,count:resultArr.count,errorCode: resultArr.errorCode,errorStatus:resultArr.errorStatus});
            }else if(resp2['errorCode'] == 0){
				resultArr			=	resp2;
				res.status(200).send({data:resultArr.data,count:resultArr.count,errorCode: resultArr.errorCode,errorStatus:resultArr.errorStatus});
			}else {
                res.status(403).send({errorCode:1,errorStatus:"No Data Found"});
            }
        } catch(err) {
            res.status(500).send({errorCode:1,errorStatus:err.stack});
        }
    }
    executeParallel();
}

//////////////////////////////////////MENU-DISPOSITION Ends///////////////////////////////////////////////////

exports.getTmeInfo  =   (req,res)=>{
    if (!req.body.empcode || (req.body.empcode && req.body.empcode == "")) {
        return res.status(200).send({ errorCode: 1, errorMsg: "Employee code is blank"})
    }
    
}

exports.sendOtp = (req,res) => {
    if(!req.body.mobNo || req.body.mobNo == "") {
        return res.status(400).send({
            message: "Mobile number cannot be empty"
        });
    }
    
    otpToSend = crOtp(function(otpToSend) {
        /* otpmodel.find({mobNo:req.body.mobNo},function(err,res) {
            console.log(res);
        }) */
        otpmodel.update({mobNo:req.body.mobNo},{otpUseFlag:2},{multi:true},function(err,numAffected){
            const otpObj = new otpmodel({
                ucode: req.body.mobNo,
                mobNo: req.body.mobNo,
                otp: otpToSend
            });
            otpObj.save().then(data => {
                var smsUrl = paths.smsapi + "?source=Vc_Reseller&city_name=IDC&mobile=" + req.body.mobNo + "&DNDAllow=1&sms_text=" + otpToSend + "+is+your+OTP+for+JD+Reseller.&msg_id=D555CCA19C940218ACAD17ED44CD73C1&vcode=" + otpToSend;
                
                var retImgData = curlObj.curlCall('xxx', smsUrl, {},'get', function (resp) {
                    if (resp == 'success') {
                        res.json({ errorCode: 0, errorMsg: "OTP sent successfully" });
                    } else {
                        res.status(500).send({
                            errorCode: 1, errorMsg: err.message || "Some error occurred while sending OTP."
                        });
                    }
                });
            }).catch(err => {
                res.status(500).send({
                    errorCode:1,errorMsg: err.message || "Some error occurred while sending OTP."
                });
            }); 
        });
    });
}

exports.verifyOtp = (req,res) => {
    if(!req.body.mobNo || req.body.mobNo == "") {
        return res.status(400).send({
            errorCode: 1, errorMsg: "Mobile number cannot be empty"
        });
    }
    if(!req.body.otp || req.body.otp == "") {
        return res.status(400).send({
            errorCode: 1, errorMsg: "OTP cannot be empty"
        });
    }
    otpmodel.find({mobNo:req.body.mobNo,otp:req.body.otp,otpUseFlag:'0'},function(err,mongores) {
        if(mongores.length > 0) {
            otpmodel.update({mobNo:req.body.mobNo},{otpUseFlag:1},{multi:true},function(err,numAffected){
                findUserData(req.body.mobNo,function(result) {
                    if(result.length == 0) {
                        const userObj = new usermodel.userModel({
                            ucode: "reseller_"+req.body.mobNo,
                            uname:"",
                            mobNo: req.body.mobNo
                        });
                        userObj.save().then(data => {
                            /* req.session.uid = "reseller_"+req.body.mobNo; */
                            
                            sessionmodel.setSessId("reseller_" + req.body.mobNo,function(resp) {
                                findAndUpdateReferral(req.body.mobNo, resp['sessid'],function (retData) {
                                    console.log(retData);
                                    if (resp['errorCode'] == 0) {
                                        res.json({ errorCode: 0, errorMsg: "OTP Verified, new user registered", authtoken: resp['sessid'],newUserFlg:1 });
                                    } else {
                                        res.status(500).send({ errorCode: 1, errorMsg: resp['errorMsg'] });
                                    } 
                                });
                            });
                        }).catch(err => {
                            res.status(500).send({
                                errorCode: 1, errorMsg: err.message || "Some error occurred while registering a new user."
                            });
                        });
                    } else {
                        const loginObj = new usermodel.LoginModel({
                            ucode: "reseller_" + req.body.mobNo,
                            login_flag:1,
                            login_time: Date.now(),
                            logout_time: Date.now()
                        });
                        loginObj.save().then(data => {
                            /* if (typeof req.session.uid === 'undefined') {
                                req.session.uid = "reseller_"+req.body.mobNo;
                            } */
                            sessionmodel.setSessId("reseller_" + req.body.mobNo,function(resp) {
                                if(resp['errorCode']    ==  0) {
                                    res.json({ errorCode: 0, errorMsg: "OTP Verified, old user login",authtoken:resp['sessid'],newUserFlg:0 });
                                } else {
                                    res.status(500).send({ errorCode: 1, errorMsg: resp['errorMsg'] });
                                }
                            });
                        }).catch(err => {
                            res.status(500).send({
                                errorCode: 1, errorMsg: err.message || "OTP verified, user login entry failed. Stop login"
                            });
                        });
                    }
                });
            }).catch(err=>{
                res.status(500).send({
                    errorCode: 1, errorMsg: err.message || "Some error occurred while updating otp usage flag."
                });
            });
        } else {
            res.status(400).send({
                errorCode:1,errorMsg:"Sorry! Wrong OTP"
            });
        }
    });
}

exports.validateUserLogin = (req,res)=>{
    /* var retArr = {};
    if (typeof req.session.uid === 'undefined') {
        res.status(502).send({errorCode:1,errorMsg:"Sorry user not logged in"});
    } else {
        res.status(200).send({ errorCode: 0, errorMsg: "User Logged in", data: { reseller_id: req.session.uid} });
    } */
}

exports.destroyUserSession = (req,res)=>{
    if (!req.body.sessid || (req.body.sessid && req.body.sessid == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Session id not sent" });
    }
    sessionmodel.destroySession(req.body.sessid,function(resp){
        return res.send(resp);
    })
}

exports.checkSessId = (req,res)=>{
    if (!req.body.sessid || (req.body.sessid && req.body.sessid == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Session id not sent" });    
    }
    sessionmodel.checkSessId(req.body.sessid,function(resp) {
        res.send(resp);
    })
}

exports.setSessData = (req,res)=>{
    if (!req.body.sessid || (req.body.sessid && req.body.sessid == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Session id not sent" });
    }
    if (!req.body.sessItem || (req.body.sessItem && req.body.sessItem == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Session Data not sent" });
    }
    sessionmodel.setSessItem(req.body.sessid,function(resp) {
        res.send(resp);
    },JSON.parse(req.body.sessItem));
}

exports.setBearToken = (req,res)=>{
    sessionmodel.createBearToken(req.param('ucode'), req.param('module'), req.param('ip'),resp=>{
        res.send(resp);
    })
}

exports.getDashboardData = (req,res) =>{
    if (!req.body.ucode || (req.body.ucode && req.body.ucode == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Usercode not sent" });
    }
    var ctNewList = 0;
    var ctNewListPaid = 0;
    var rewardAmt = 0;
    contractmodel.count({added_by:req.body.ucode},function(err,c) {
        if(err) {
            return res.status(500).send({errorCode:1,errorMsg:err.toString() || "Some error is encountered. Please try again"});
        }
        ctNewList = c;
        contractmodel.count({added_by:req.body.ucode,paid:1},function(err,ctPaid) {
            if(err) {
                return res.status(500).send({errorCode:1,errorMsg:err.toString() || "Some error is encountered. Please try again"});
            }
            ctNewListPaid = ctPaid;
            paymentmodel.rewardModel.find({ucode:req.body.ucode}).then(data=>{
                if(data.length > 0) {
                    for(var key in data) {
                        rewardAmt   =   rewardAmt+data[key]['reward'];
                    }
                    var retArr = {};
                    retArr['newData']   =   ctNewList;
                    retArr['newPaid']   =   ctNewListPaid;
                    retArr['rewardAmt'] =   rewardAmt;
                    res.status(200).send({errorCode:0,errorMsg:'Data Returned',data:retArr}); 
                } else {
                    var retArr = {};
                    retArr['newData']   =   ctNewList;
                    retArr['newPaid']   =   ctNewListPaid;
                    retArr['rewardAmt'] =   0;
                    res.status(200).send({errorCode:0,errorMsg:'Data Returned',data:retArr}); 
                }
            }).catch(err=>{
                return res.status(500).send({errorCode:1,errorMsg:err.toString() || "Some error is encountered. Please try again"});
            });
        });
    });
}

var findUserData = (userid,cb)=>{
    usermodel.userModel.find({ucode:"reseller_"+userid},function(err,respObj){
        console.log(respObj);
        cb(respObj);
    });
}

var crOtp =  (cb)=> {
    var minimum = 10000;
    var maximum = 99999;
    var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    cb(randomnumber);
}

var findAndUpdateReferral = (reff_no,sessid,cb)=>{
    referralObj.referralInsObj.find({referrer_number:reff_no,accept_flag:0}).then(doc=>{
        if(doc.length > 0) {
            var jdboxUrl = paths.jdboxurl + "/services/mongoWrapper.php?action=getalldata&post_data=1&parentid=" + doc[0]['reff_docid'] + "&data_city=" + doc[0]['data_city']+"&module=ME";
            var retImgData = curlObj.curlCall('xxx', jdboxUrl, {}, 'get', function (respMongo) {
                var respMongoParse = JSON.parse(respMongo);
                var uuid = helperFunc.generateUUID();
                var catidStr = "";
                if (respMongoParse['tbl_business_temp_data']['catIds'] != null) {
                    var expCatidStr = respMongoParse['tbl_business_temp_data']['catIds'].split("|P|");
                    for (var keyexpId in expCatidStr) {
                        if (expCatidStr[keyexpId] != "") {
                            catidStr += expCatidStr[keyexpId]+",";
                        }
                    }
                    var catNameStr = "";
                    var expCatNameStr = respMongoParse['tbl_business_temp_data']['categories'].split("|P|");
                    for (var keyexpName in expCatNameStr) {
                        if (expCatNameStr[keyexpName] != "") {
                            catNameStr += expCatNameStr[keyexpName] + ",";
                        }
                    }
                }

                const contractObj = new contractmodel({
                    temp_docid: uuid,
                    bus_name: respMongoParse['tbl_companymaster_generalinfo_shadow']['companyname'],
                    owner_name: respMongoParse['tbl_companymaster_generalinfo_shadow']['contact_person'],
                    city: respMongoParse['tbl_companymaster_generalinfo_shadow']['city'],
                    mobile_num: respMongoParse['tbl_companymaster_generalinfo_shadow']['mobile'],
                    landline_num: respMongoParse['tbl_companymaster_generalinfo_shadow']['landline'],
                    email_id: respMongoParse['tbl_companymaster_generalinfo_shadow']['email'],
                    catid: catidStr.slice(0,-1),
                    catname: catNameStr.slice(0, -1),
                    img_path: {},
                    added_by: "reseller_" + reff_no,
                    pincode: respMongoParse['tbl_companymaster_generalinfo_shadow']['pincode']
                });
                contractObj.save().then(data => {
                    
                    referralObj.referralInsObj.update({ referrer_number: reff_no }, { referrer_code: "reseller_" + reff_no, accept_flag: 1 }, function (err,numAffected){
                        if(err) {
                            console.log(err);
                            var retObj = { errorCode: 1, errorMsg: err.message || "Error in updating the referral data. Please try again" };
                            cb(retObj);
                            return false;
                        }
                        sessionmodel.setSessItem(sessid, function (resp) {
                            if (resp['errorCode'] == 0) {
                                var retObj = { errorCode: 0, errorMsg: "Session id updated" };
                                cb(retObj);
                            } else {
                                var retObj = { errorCode: 1, errorMsg: "Session id not updated" };
                                cb(retObj);
                            }
                        }, { docid: uuid });
                    });
                }).catch(err=>{
                    var retObj = { errorCode: 1, errorMsg: err.message || "Error in saving the data. Please try again" };
                    cb(retObj);
                })
            });
        } else {
            var retObj = { errorCode: 1, errorMsg: "Referral data not found" };
            cb(retObj);
        }
    }).catch(err=>{
        var retObj = { errorCode: 1, errorMsg: err.message|| "error while finding referral data" };
        cb(retObj);
    });
}
