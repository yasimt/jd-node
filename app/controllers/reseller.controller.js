const usermodel = require('../models/user.model.js');
const dbconfig = require("../../config/database.config.js");
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const helperFunc = require('../utility/helperFunc.js');
const md5 = require('md5');
const myObj = require('../utility/connect.mysql.js');
const os = require('os');
const mom = require('moment');
const Datetime = require('node-datetime');
const envObj = require('../../config/env.conf.js');
const paymentmodel = require("../models/payment.model.js");
const referralmodel = require("../models/referral.model.js");
var shortid = require('shortid');

exports.checkUserLogin = (req, res) => {
    if (!req.param('mob_num') || (req.param('mob_num') && req.param('mob_num') == "")) {
        return res.status(400).send({ errorCode: 0, errorMsg: "Mobile Number is blank" });
    }
    var checkUserRegistration = async () => {
        try {
            var userData = await usermodel.userModel.find({ ucode: "reseller_" + req.param('mob_num') });
            if (userData.length > 0) {
                res.redirect(paths.genioliteurl + '/resellerSetLogin.php?ucode=' + userData[0]['ucode'] + '&city=' + userData[0]['city']);
            } else {
                res.redirect(paths.genioliteurl + '/#/welcome-reseller');
            }
        } catch (err) {
            res.status(500).send({ errorCode: 1, errorMsg: err });
        }
    }
    checkUserRegistration();
}

exports.insertReseller = (req, res) => {
    if (!req.body.name || (req.body.name && req.body.name == "")) {
        return res.status(400).send({ errorCode: 0, errorMsg: "Employee name is blank" });
    }
    if (!req.body.mobNo || (req.body.mobNo && req.body.mobNo == "")) {
        return res.status(400).send({ errorCode: 0, errorMsg: "Mobile Number is blank" });
    }
    if (!req.body.city || (req.body.city && req.body.city == "")) {
        return res.status(400).send({ errorCode: 0, errorMsg: "City is blank" });
    }
    if (!req.body.reselType || (req.body.reselType && req.body.reselType == "")) {
        return res.status(400).send({ errorCode: 0, errorMsg: "Reseller Type is blank" });
    }
    var checkuserLogin = async () => {
        try {
            var userData = await usermodel.userModel.find({ ucode: "reseller_" + req.body.mobNo });
        } catch (e) {
            res.status(500).send({ errorCode: 2, errorMsg: e.stack });
        }
        if (userData.length > 0) {
            if (userData[0]['active_flag'] == 1) {
                res.status(200).send({ errorCode: 1, errorMsg: "User already exists" });
            } else if (userData[0]['active_flag'] == 0) {
                try {
                    await usermodel.userModel.remove({ ucode: "reseller_" + req.body.mobNo });
                } catch (e) {
                    res.status(500).send({ errorCode: 2, errorMsg: e.stack });
                }
                await insertUserData(req);

                res.status(200).send({ errorCode: 0, errorMsg: "Data Saved successfully" });
            }
        } else {
            await insertUserData(req);
            res.status(200).send({ errorCode: 0, errorMsg: "Data Saved successfully" });
        }
    }

    var insertUserData = async (req) => {
        try {
            var otp = crOTP();
            var ref_flag = 0;
            if (req.body.reff_code != "" && req.body.reff_code != null) {
                ref_flag = 2;
            } else if (req.body.temp_code != "" && req.body.temp_code != null) {
                ref_flag = 1;
            }
            const resellerObj = new usermodel.userModel({
                ucode: "reseller_" + req.body.mobNo,
                uname: req.body.name,
                mobNo: req.body.mobNo,
                email: req.body.email,
                city: req.body.city,
                profile_flag: req.body.reselType,
                active_flag: 0,
                refferal_flag: ref_flag,
                otp: otp
            });
            var saveObj = await resellerObj.save();
            var smsUrl = paths.smsapi + "?source=Vc_Reseller&city_name=IDC&mobile=" + req.body.mobNo + "&DNDAllow=1&sms_text=" + otp + "+is+your+OTP+for+JD+Reseller.&msg_id=D555CCA19C940218ACAD17ED44CD73C1&vcode=" + otp;
            var retImgData = await curlObj.curlCall('xxx', smsUrl, {}, 'get');
            if (req.body.temp_code == "" || req.body.temp_code == null || typeof req.body.temp_code === "undefined") {
                var findData = await referralmodel.referralInsObj.find({ referrer_number: req.body.mobNo, accept_flag: 0, referral_id: req.body.reff_code });
                if (findData.length == 0) {
                    var updData = await referralmodel.referralInsObj.findOneAndUpdate({ referrer_number: req.body.mobNo, accept_flag: 0, referral_id: req.body.reff_code }, { referrer_module: "Reseller", referrer_code: "", name: req.body.name, accept_type_flag: 2 }, { upsert: true, new: true });
                }
            }
            if (req.body.temp_code != "" && req.body.temp_code != null && typeof req.body.temp_code !== "undefined") {
                var findData = await referralmodel.referralInsObj.find({ referrer_code: req.body.temp_code });
                if (findData.length > 0) {
                    var updData = await referralmodel.referralInsObj.findOneAndUpdate({ referrer_number: req.body.mobNo, accept_flag: 0, referral_id: findData[0]['referral_id'] }, { referrer_module: "Reseller", referrer_code: "", name: req.body.name, accept_type_flag: 1 }, { upsert: true, new: true });
                    var dt = Datetime.create();
                    var formatted = dt.format('Y-m-d H:M:S');

                    var insTempMainMapping = await referralmodel.tempMainReselInsObj.findOneAndUpdate({ temp_id: req.body.temp_code, main_id: "reseller_" + req.body.mobNo }, { active_flag: 0 }, { upsert: true, new: true });
                }
            }
            return saveObj;
        } catch (e) {
            if (e instanceof SyntaxError) {
                console.log('sdcds');
            } else {
                res.status(500).send({ errorCode: 1, errorMsg: e.stack });
            }
        }
    }
    checkuserLogin();
}

var crOTP = () => {
    var minimum = 100000;
    var maximum = 999999;
    var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    return randomnumber;
}

exports.checkOTP = (req, res) => {
    //res.send(req.body.reff_code);
    if (!req.body.mobNo || (req.body.mobNo && req.body.mobNo == "")) {
        return res.status(400).send({ errorCode: 1, errorStatus: "Mobile number is empty" });
    }
    if (!req.body.otp || (req.body.otp && req.body.otp == "")) {
        return res.status(400).send({ errorCode: 1, errorStatus: "OTP is empty" });
    }
    var checkUserData = async () => {
        try {
            var userData = await usermodel.userModel.find({ ucode: "reseller_" + req.body.mobNo });
            if (userData[0]['otp'] == req.body.otp) {
                if (userData[0]['refferal_flag'] == 1) {
                    var getUserData = await usermodel.userModel.findOneAndUpdate({ ucode: "reseller_" + req.body.mobNo }, { active_flag: 1 }, { new: true });
                    var updData = await referralmodel.referralInsObj.update({ referrer_number: req.body.mobNo, accept_flag: 0 }, { accept_flag: 1, referrer_code: "reseller_" + req.body.mobNo }, { multi: true });
                    var postData = {};
                    postData['isJson'] = 1;
                    postData['auth_token'] = "23f4abbce8717e69f1d2b8f7ad9dcf73";
                    postData['user_code'] = getUserData['ucode'];
                    postData['user_name'] = getUserData['uname'];
                    postData['mobile_no'] = getUserData['mobNo'];
                    postData['email_id'] = getUserData['email'];
                    postData['city'] = getUserData['city'];
                    postData['resel_type'] = 1;
                    var headObj = {};
                    var insertResellerSSO = await curlObj.curlCall('', paths.ssoapiurl + "api/registerReseller.php", postData, 'xxx', headObj);
                    var parseResp = JSON.parse(insertResellerSSO);

                    var dbParam = dbconfig['idconline'];
                    var mysqlObj = new myObj(dbParam);
                    var getAllocTime = await mysqlObj.query("INSERT INTO tbl_users_campaign_mapping SET empcode = '" + getUserData['ucode'] + "',empname='" + getUserData['uname'] + "',allowed_campids='14,4,12,25',is_limited_access=1 ON DUPLICATE KEY UPDATE is_limited_access=1");
                    res.status(200).send({ errorCode: 0, errorMsg: "OTP Verified", ref_flag: userData[0]['refferal_flag'], ucode: "reseller_" + req.body.mobNo, city: getUserData['city'] });
                } else {
                    var trans_id = await helperFunc.generateUUID();
                    var dt = Datetime.create();
                    var formatted = dt.format('Y-m-d H:M:S');

                    const resellerPayObj = new paymentmodel.paymentResellerModel({
                        resellerid: "reseller_" + req.body.mobNo,
                        amount: 9999,
                        payment_flag: 0,
                        trans_id: trans_id,
                        payment_mode: "",
                        payment_det: {},
                        payment_done_on: formatted
                    });
                    var savePaymentObj = await resellerPayObj.save();
                    var formData = {
                        data: {
                            id: trans_id,
                            data_city: userData[0]['city'],
                            vertical: "999999",
                            droppayopt: "COD,PAYU,OFLC,NEFT,CK",
                            mobile: userData[0]['mobNo'],
                            email: userData[0]['email'],
                            apiurl: req.protocol + '://' + req.get('host') + '/jdboxNode/payment/reseller-trans-details?tid=' + trans_id,
                            header: "Jd Reseller",
                            env: envObj.env,
                            vname: "Reseller",
                            sapi: "",
                            updatedon: formatted,
                            updatedby: 'reseller_new_user',
                            amount: 9999,
                            bk_url: req.body.bk_url,
                            surl: req.protocol + '://' + req.get('host') + '/jdboxNode/reseller/update-reseller-state?tid=' + trans_id + '&ucode=' + "reseller_" + req.body.mobNo + "&reff_code=" + req.body.reff_code
                        }
                    };
                    var retPayData = await curlObj.curlCall('xxx', paths.paymentapi, formData, 'post');
                    var parseResp = JSON.parse(retPayData);
                    if (parseResp['error_code'] == 0) {
                        res.status(200).send({ errorCode: 0, errorMsg: "OTP Verified", ref_flag: userData[0]['refferal_flag'], data: { red_url: paths.paymentred + 'processTransaction', trans_id: trans_id } });
                    } else {
                        res.status(403).send({ errorCode: 1, errorMsg: parseResp['error_msg'] });
                    }
                }

            } else {
                res.status(200).send({ errorCode: 1, errorMsg: "Sorry OTP is wrong" });
            }
        } catch (err) {
            return res.status(500).send({ errorCode: 1, errorStatus: err.stack });
        }
    }
    checkUserData();
}

exports.updateResellerState = (req, res) => {
    var trans_id = req.param('tid');
    var payMode = req.param('c');
    var updatePaymentAsync = async () => {
        try {
            var updatePayment = await paymentmodel.paymentResellerModel.update({ trans_id: trans_id, payment_flag: 0 }, { payment_flag: 1, payment_done_on: Date.now(), payment_mode: payMode }, { multi: true });
            if (updatePayment['nModified'] > 0) {
                var retObj = {};
                retObj['errorCode'] = 0;
                retObj['errorMsg'] = "Payment Data Updated";
                return retObj;
            } else {
                var retObj = {};
                retObj['errorCode'] = 0;
                retObj['errorMsg'] = "Nothing is updated";
                return retObj;
            }
        } catch (err) {
            return res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    var updateUserStatus = async () => {
        try {
            var updateUserActive = await usermodel.userModel.findOneAndUpdate({ ucode: req.param('ucode'), active_flag: 0 }, { active_flag: 1 }, { new: true });
            if (req.param('reff_code') != "") {
                var mobNo = req.param('ucode').split("_");
                var updData = await referralmodel.referralInsObj.update({ referrer_number: mobNo[1], accept_flag: 0, referral_id: req.param('reff_code') }, { accept_flag: 1, referrer_code: req.param('ucode') }, { multi: true });
            }
            if (updateUserActive != null) {
                var retObj = {};
                retObj['errorCode'] = 0;
                retObj['errorMsg'] = "User Data Updated and returning updated data";
                retObj['data'] = updateUserActive;
                return retObj;
            } else {
                var retObj = {};
                retObj['errorCode'] = 1;
                retObj['errorMsg'] = "Nothing is updated";
                return retObj;
            }
        } catch (err) {
            return res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    var executeParallel = async () => {
        try {
            var finduserData = await usermodel.userModel.find({ ucode: req.param('ucode') });
            if (finduserData.length > 0) {
                var postData = {};
                postData['isJson'] = 1;
                postData['auth_token'] = "23f4abbce8717e69f1d2b8f7ad9dcf73";
                postData['user_code'] = req.param('ucode');
                postData['user_name'] = finduserData[0]['uname'];
                postData['mobile_no'] = finduserData[0]['mobNo'];
                postData['email_id'] = finduserData[0]['email'];
                postData['city'] = finduserData[0]['city'];
                postData['resel_type'] = 1;
                var headObj = {};
                var insertResellerSSO = await curlObj.curlCall('', paths.ssoapiurl + "api/registerReseller.php", postData, 'xxx', headObj);
                var parseResp = JSON.parse(insertResellerSSO);
            } else {
                res.status(403).send({ errorCode: 1, errorMsg: "User is not registered" });
            }
            //if (parseResp['errorCode'] == 0) {
            const [resp1, resp2] = await Promise.all([updatePaymentAsync(), updateUserStatus()]);
            if (resp1['errorCode'] == 0 && resp2['errorCode'] == 0) {
                var dbParam = dbconfig['idconline'];
                var mysqlObj = new myObj(dbParam);
                var getAllocTime = await mysqlObj.query("INSERT INTO tbl_users_campaign_mapping SET empcode = '" + req.param('ucode') + "',empname='" + resp2['data']['uname'] + "',allowed_campids='14,4,12,25',is_limited_access=1");

                if (parseResp['errorCode'] == 0) {
                    res.redirect(paths.genioliteurl + '/resellerSetLogin.php?ucode=' + req.param('ucode') + '&city=' + resp2['data']['city']);
                } else {
                    res.redirect(paths.genioliteurl + '/resellerSetLogin.php?ucode=' + req.param('ucode') + '&city=' + resp2['data']['city']);
                }
                //res.redirect(paths.genioliteurl + '/resellerSetLogin.php');
            } else {
                res.status(403).send({ errorCode: 1, errorMsg: "Nothing has updated" });
            }
            /* } else {
                //res.status(200).send({ errorCode: 1, errorMsg: parseResp['errorMsg']});
                res.render('index', { errorMsg: parseResp['errorMsg']});
            } */
        } catch (err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    executeParallel();
}

exports.sendInvite = (req, res) => {
    if (!req.body.formData['name'] || (req.body.formData['name'] && req.body.formData['name'] == "")) {
        return res.status(403).send({ errorCode: 1, errorMsg: "Please send name of the reseller" });
    }
    if (!req.body['ref_id'] || (req.body['ref_id'] && req.body['ref_id'] == "")) {
        return res.status(403).send({ errorCode: 1, errorMsg: "Please send referral id" });
    }
    var runAsync = async () => {
        try {
            let promises = [];
            for (var key in req.body.formData['mobNo']) {
                promises.push(runParallerQuery(req.body.formData['mobNo'][key], req.body.ref_id, 'Reseller', req.body.formData['name']));
            }
            var runParallel = await Promise.all(promises);
            var matchDataObj = {};
            var notSent = 0;
            for (var parKey in runParallel) {
                if (runParallel[parKey]['errorCode'] == 0) {
                    if (Object.keys(runParallel[parKey]['matchingData']).length > 0) {
                        matchDataObj[parKey] = runParallel[parKey]['matchingData'];
                    }
                } else {
                    notSent++;
                }
            }
            if (runParallel.length == notSent) {
                res.status(200).send({ errorCode: 1, errorMsg: "Resellers are already active" });
            } else {
                res.status(200).send({ errorCode: 0, errorMsg: "Reseller Invitation link sent", ratingData: matchDataObj });
            }

        } catch (err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    var runParallerQuery = async (ref_no, ref_id, ref_mod, ref_name) => {
        try {
            var retData = {};
            var referralFind = await referralmodel.referralInsObj.find({ referrer_number: ref_no, accept_flag: 1 });
            if (referralFind.length == 0) {
                var matchContData = await checkMatchingContract(ref_no);
                var updData = await referralmodel.referralInsObj.findOneAndUpdate({ referrer_number: ref_no, accept_flag: 0, referral_id: ref_id }, { referrer_module: ref_mod, referrer_code: "", name: ref_name }, { upsert: true, new: true });
                retData['errorCode'] = 0;
                retData['errorMsg'] = 'data updated';
                retData['matchingData'] = {};
                if (matchContData['errorCode'] == 0) {
                    retData['matchingData'] = matchContData['data'];
                }

                var shortCode = await generateShortCode(ref_id);

                var smsUrl = paths.smsapi + "?source=JDRR_Link_send&city_name=IDC&mobile=" + ref_no + "&DNDAllow=1&sms_text=" + paths.selfpath + "/jdboxNode/invite/" + shortCode['shortCode'] + "+is+your+Link+for+JD+Reseller&msg_id=4AA53A4C472C808BEC55EFAAEE367887&URL=" + paths.selfpath + "/jdboxNode/invite/" + shortCode['shortCode'];

                var retImgData = curlObj.curlCall('xxx', smsUrl, {}, 'get');
                retData['errorCode'] = 0;
                retData['errorMsg'] = 'reseller sms sent';
            } else {
                retData['errorCode'] = 1;
                retData['errorMsg'] = 'reseller already active';
            }
            return retData;
        } catch (err) {
            return res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    var checkMatchingContract = async (ref_no) => {
        var matchingContData = paths.matchNumberapi + "mvc/services/autosuggest/autosuggest_class/whatwhere?search=" + ref_no + "&scity=all&dcity=Mumbai&type=phone&limit=1000&trace=0";
        var retMatchData = {};
        try {
            var retMatchingData = await curlObj.curlCall('xxx', matchingContData, {}, 'get');
            retMatchingData = JSON.parse(retMatchingData);
            if (retMatchingData['results']['data'] == null) {
                retMatchData['errorCode'] = 1;
                retMatchData['errorMsg'] = "data not found";
            } else {
                retMatchData['errorCode'] = 0;
                retMatchData['errorMsg'] = "data found";
                var checkPaid = 0;
                for (var key in retMatchingData['results']['data']) {
                    if (retMatchingData['results']['data'][key]['pflg'] == 1) {
                        return res.status(200).send({ errorCode: 1, errorMsg: "Paid contract found" });
                    }
                }
                retMatchData['data'] = {};
                retMatchData['data'] = retMatchingData['results']['data'];
            }
            return retMatchData;
        } catch (err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    var generateShortCode = async (ref_id) => {
        try {
            var retArr = {};
            var ref_type = req.body['formData']['invitationType'];
            var shortCodeCheck = await referralmodel.shortCodeInsObj.find({ refferer_id: ref_id, referral_type: ref_type });
            if (shortCodeCheck.length > 0) {
                retArr['errorCode'] = 0;
                retArr['errorMsg'] = "Returning existing short code";
                retArr['shortCode'] = shortCodeCheck[0]['short_id'];
                return retArr;
            } else {
                const short_id = shortid.generate();

                const shortCodeIns = new referralmodel.shortCodeInsObj({
                    short_id: short_id,
                    refferer_id: ref_id,
                    referral_type: ref_type
                });
                try {
                    var saveObj = await shortCodeIns.save();
                    retArr['errorCode'] = 0;
                    retArr['errorMsg'] = "Returning new short code";
                    retArr['shortCode'] = short_id;
                } catch (err) {
                    res.status(500).send({ errorCode: 1, errorMsg: err.stack });
                }
                return retArr;
            }
        } catch (err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    runAsync();
}

exports.checkInvitation = (req, res) => {
    if (!req.param('shortid') || (req.param('shortid') && req.param('shortid') == "")) {
        res.status(403).send({ errorCode: 1, errorMsg: "Please send valid URL. Short code missing" });
    }
    var runAsync = async () => {
        try {
            var shortCodeCheck = await referralmodel.shortCodeInsObj.find({ short_id: req.param('shortid') });
            if (shortCodeCheck.length > 0) {
                if (shortCodeCheck[0]['referral_type'] == 2) {
                    var resellerId = shortid.generate();
                    const resellerObj = new usermodel.userModel({
                        ucode: "TEMP_RES_" + resellerId,
                        uname: "User",
                        mobNo: "",
                        email: "",
                        city: "",
                        profile_flag: 2,
                        active_flag: 0,
                        refferal_flag: 1,
                        otp: ""
                    });
                    var saveObj = await resellerObj.save();
                    var updData = await referralmodel.referralInsObj.findOneAndUpdate({ referrer_code: "TEMP_RES_" + resellerId, accept_flag: 0, referral_id: shortCodeCheck[0]['refferer_id'] }, { referrer_module: "Reseller", referrer_number: "", name: "", accept_type_flag: 2 }, { upsert: true, new: true });

                    var dbParam = dbconfig['idconline'];
                    var mysqlObj = new myObj(dbParam);
                    var getAllocTime = await mysqlObj.query("INSERT INTO tbl_users_campaign_mapping SET empcode = 'TEMP_RES_" + resellerId + "',empname='',allowed_campids='14,4,12,25',is_limited_access=1");

                    res.redirect(paths.genioliteurl + '/business_setLogin.php?ucode=TEMP_RES_' + resellerId);
                } else {
                    res.redirect(paths.genioliteurl + '/reseller_setInvite.php?reff_code=' + shortCodeCheck[0]['refferer_id']);
                }

            } else {
                res.status(403).send({ errorCode: 1, errorMsg: "Not a valid URL. Please check the URL" });
            }
        } catch (err) {
            res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
    }
    runAsync();
}

exports.getLineage = async (req, res) => {
    if (!req.body.empcode || (req.body.empcode && req.body.empcode == "")) {
        res.status(403).send({ errorCode: 1, errorMsg: "Please send employee code" });
    }
    if (!req.body.empname || (req.body.empname && req.body.empname == "")) {
        res.status(403).send({ errorCode: 1, errorMsg: "Please send employee name" });
    }
    var init = 0;
    var retArr = {};
    try{
        var retData = await runAsyncLineage(req.body.empcode,req.body.empname, retArr, init);
        res.status(200).send({errorCode:0,errorMsg:"Lineage returned",retData:retData});
    } catch(err) {
        res.status(500).send({ errorCode: 1, errorMsg: err.stack });
    }
}

var runAsyncLineage = async (param,name, retArr, i,resp) => {
    try{
        if (param == 0) {
            var childEmp = await referralmodel.referralInsObj.find({ referral_id: req.body.empcode, accept_flag: 1 });
        } else {
            var childEmp = await referralmodel.referralInsObj.find({ referral_id: param, accept_flag: 1 });
        }
        if (childEmp.length > 0) {
            if (typeof retArr[param] === 'undefined') {
                if(i == 0) {
                    retArr[param] = {};
                    retArr[param]['empname'] = name;
                    retArr[param]['empcode']    =   param;
                } else {
                    retArr[param] = {};
                }
            }
            if (typeof retArr[param]['child'] === 'undefined') {
                retArr[param]['child'] = {};
            }
            i++;
            for (var key in childEmp) {
                retArr[param]['child'][childEmp[key]['referrer_code']] = {};
                retArr[param]['child'][childEmp[key]['referrer_code']]['empname'] = childEmp[key]['name'];
                retArr[param]['child'][childEmp[key]['referrer_code']]['empcode'] = childEmp[key]['referrer_code'];
                await runAsyncLineage(childEmp[key]['referrer_code'], childEmp[key]['name'], retArr[param]['child'], i, resp);
            }
        } else {
            retArr[param] = {};
            retArr[param]['empname'] = name;
            retArr[param]['empcode'] = param;
        }
        return retArr;
    } catch(err) {
        resp.status(500).send({errorCode:1,errorMsg:err.stack});
    }
}

exports.addKycDocs = async (req,res)=>{
    if (!req.body.empcode || (req.body.empcode && req.body.empcode == "")) {
        res.status(403).send({ errorCode: 1, errorStatus: "Please send user code" });
    }
    if (req.body.formData['licNo'] == "" && req.body.formData['adhar'] == "" && req.body.formData['panCard'] == "" && req.body.formData['passNo'] == "") {
        res.status(403).send({errorCode:1,errorStatus:"Please send atleast one document"});
    }
    try{
        const kycObj = new usermodel.KycModel({
            ucode: req.body.empcode,
            lic_no: req.body.formData['licNo'],
            adhar:req.body.formData['adhar'],
            panCard: req.body.formData['panCard'],
            passNo: req.body.formData['passNo']
        });
        var saveObj = await kycObj.save();
        res.status(200).send({errorCode:0,errorMsg:"KYC Details are saved successfully"});
    } catch(err) {
        res.status(500).send({errorCode:1,errorMsg:err.stack});
    }
}

exports.checkKYC =  async (req,res)=>{
    if (!req.body.empcode || (req.body.empcode && req.body.empcode == "")) {
        res.status(403).send({ errorCode: 1, errorStatus: "Please send user code" });
    }
    try {
        var retData = await usermodel.KycModel.find({ucode:req.body.empcode});
        if (retData.length > 0) {
            res.status(200).send({ errorCode: 0, errorMsg: "Data Found",data:retData[0] });    
        } else {
            res.status(200).send({ errorCode: 1, errorMsg: "Data Not Found"});    
        }
    } catch(err) {
        res.status(500).send({errorCode:1,errorMsg:err.stack});
    }
}

exports.resendOTP = async (req,res)=>{
    if (!req.body.mobNo || (req.body.mobNo && req.body.mobNo == "")) {
        res.status(403).send({ errorCode: 1, errorStatus: "Please send mobile number" });
    }
    try{
        var userData = await usermodel.userModel.find({ ucode: "reseller_" + req.body.mobNo });
        if (userData.length > 0) {
            var smsUrl = paths.smsapi + "?source=Vc_Reseller&city_name=IDC&mobile=" + req.body.mobNo + "&DNDAllow=1&sms_text=" + userData[0]['otp'] + "+is+your+OTP+for+JD+Reseller.&msg_id=D555CCA19C940218ACAD17ED44CD73C1&vcode=" + userData[0]['otp'];
            var retImgData = await curlObj.curlCall('xxx', smsUrl, {}, 'get');
            res.status(200).send({ errorCode: 0, errorMsg: "OTP Sent successfully" });    
        } else {
            res.status(200).send({ errorCode: 1, errorMsg: "User doesn't exist" });
        }
    } catch(err) {
        res.send(500).status({errorCode:1,errorMsg:err.stack});
    }

}
