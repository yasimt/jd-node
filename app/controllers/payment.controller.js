const paymentObj = require('../models/payment.model.js');
const usermodel = require('../models/user.model.js');
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const envObj = require('../../config/env.conf.js');
const helperFunc = require('../utility/helperFunc.js');
const contractObj = require('../models/contract.model.js');
const Datetime = require('node-datetime');

exports.insertPaymentData = (req,res)=>{
    if (!req.body.amount || req.body.amount && req.body.amount == "") {
        return res.status(400).send({errorCode:1,errorMsg:"Please send amount"});
    }
    if (!req.body.docid || req.body.docid && req.body.docid == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send docid of the contract" });
    }
    if (!req.body.tenure || req.body.tenure && req.body.tenure == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send tenure" });
    }
    if (!req.body.ucode || req.body.ucode && req.body.ucode == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send user code" });
    }
    paymentObj.paymentInfoModel.update({ docid: req.body.docid, payment_flag: 0 }, { payment_flag: 2 }, { multi: true }, function (err, numAffected) {
        var paymentIns = new paymentObj.paymentInfoModel({
            docid:req.body.docid,amount:req.body.amount,tenure:req.body.tenure,ucode:req.body.ucode
        });
        paymentIns.save().then(data => {
            res.send({ errorCode: 0, errorMsg: "Amount details saved. Setting for payment"});
        }).catch(err=>{
            res.status(500).send({
                errorCode:1,errorMsg: err.message || "Some error occurred while saving contract details."
            });
        });
    })
}

exports.getPaymentData = (req,res)=>{
    if (!req.body.docid || req.body.docid && req.body.docid == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send docid of the contract" });
    }
    paymentObj.paymentInfoModel.find({docid:req.body.docid,payment_flag:0}).then(resp=>{
        if(resp.length > 0) {
            res.status(200).send({ errorCode: 0, errorMsg: "Data Found", data: resp });
        } else {
            res.status(402).send({ errorCode: 1, errorMsg: "Data Not Found" });
        }
    }).catch(err=>{
        res.status(500).send({ errorCode: 1, errorMsg: err.msg || "Something went wrong" });
    })
}

exports.makePayment = (req,res)=>{
    if (!req.body.docid || req.body.docid && req.body.docid == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send docid of the contract" });
    }
    if (!req.body.bk_url || req.body.bk_url && req.body.bk_url == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send back url" });
    }
    if (!req.body.surl || req.body.surl && req.body.surl == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send success url" });
    }
    if (!req.body.amount || req.body.amount && req.body.amount == "") {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send amount" });
    }
    contractObj.find({ temp_docid: req.body.docid}).then(resp=>{
        if (resp.length > 0) {
            var trans_id = helperFunc.generateUUID();
            paymentObj.paymentInfoModel.update({ docid: req.body.docid, payment_flag: 0 }, { trans_id: trans_id,process_amount:req.body.amount }, { multi: true }, function (err, numAffected) {
                var dt = Datetime.create();
                var formatted = dt.format('Y-m-d H:M:S');
                var formData = {
                    data: {
                        id: trans_id,
                        data_city: resp[0].city,
                        vertical: "999999",
                        droppayopt: "COD,PAYU,OFLC,NEFT,CK",
                        mobile: resp[0].mobile_num,
                        email:resp[0].email_id,
                        apiurl: req.protocol + '://' + req.get('host') + '/reseller_services/payment/payment-trans-details?tid=' + trans_id,
                        header: "Jd Reseller",
                        env: envObj.env,
                        vname: "Reseller",
                        sapi: "",
                        updatedon: formatted,
                        updatedby: resp[0].added_by,
                        amount: req.body.amount,
                        bk_url: req.body.bk_url,
                        surl: req.body.surl
                    }
                };
                curlObj.curlCall('xxx', paths.paymentapi, formData, 'post', function (resp) {
                    var parseResp = JSON.parse(resp);
                    if (parseResp['error_code'] == 0) {
                        res.status(200).send({ errorCode: 0, errorMsg: "Payment Transaction successfully done. redirect to the url", data: { red_url: paths.paymentred +'processTransaction', trans_id: trans_id}})
                    } else {
                        res.status(403).send({ errorCode: 1, errorMsg: parseResp['error_msg']});
                    }
                });
            });
        } else {
            res.status(402).send({ errorCode: 1, errorMsg: "Contract details not found"});
        }
    }).catch(err=>{
        res.status(500).send({ errorCode: 1, errorMsg: err.msg || "Something went wrong" });
    });
    //paymentapi
}

exports.paymentTrasnDet = (req,res) => {
    var trans_id = req.param('tid');
    paymentObj.paymentInfoModel.find({ trans_id: trans_id }).then(resp => {
        if(resp.length > 0) {
            contractObj.find({ temp_docid: resp[0]['docid'] }).then(respCont => {
                var retArr = {};
                retArr['errorCode'] = 0;
                retArr['errorStatus'] = "Success";
                retArr['payment'] = {};
                retArr['payment']['payable_amount'] = resp[0]['process_amount'];
                retArr['sender']    =   {};
                retArr['sender']['senders_name'] = respCont[0]['owner_name'];
                retArr['sender']['senders_mobile'] = respCont[0]['mobile_num'];
                retArr['sender']['senders_email'] = respCont[0]['email_id'];
                res.status(200).send(retArr);
            }).catch(eCont=>{
                res.status(500).send({ errorCode: 1, errorMsg: err.msg || "Something went wrong" });        
            })
        } else {
            res.status(404).send({ errorCode: 1, errorMsg: "Data not found for transaction id" });        
        }
    }).catch(e=>{
        res.status(500).send({ errorCode: 1, errorMsg: err.msg || "Something went wrong" });
    });
}

exports.resellerTransDetails = (req,res) => {
    var trans_id = req.param('tid');
    var getResellerPay = async ()=>{
        try{
            var paymentInfo =   await paymentObj.paymentResellerModel.find({ trans_id: trans_id });
            if(paymentInfo.length > 0) {
                var userInfo = await usermodel.userModel.find({ ucode: paymentInfo[0]['resellerid'] });

                var retArr = {};
                retArr['errorCode'] = 0;
                retArr['errorStatus'] = "Success";
                retArr['payment'] = {};
                retArr['payment']['payable_amount'] = 9999;
                retArr['sender']    =   {};
                retArr['sender']['senders_name'] = userInfo[0]['uname'];
                retArr['sender']['senders_mobile'] = userInfo[0]['mobNo'];
                retArr['sender']['senders_email'] = userInfo[0]['email'];
                res.status(200).send(retArr);
            }
        } catch(err) {
            res.status(500).send({errorCode:1,errorMsg:err.stack});
        }
    }
    getResellerPay();
}

exports.updatePaymentDetails = (req,res)=>{
    if (!req.body.docid || (req.body.docid && req.body.docid == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send docid of the contract" });
    }
    if (!req.body.tid || (req.body.tid && req.body.tid == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send transaction id" });
    }
    if (!req.body.ucode || (req.body.ucode && req.body.ucode == "")) {
        return res.status(400).send({ errorCode: 1, errorMsg: "Please send usercode" });
    }
    paymentObj.paymentInfoModel.findOneAndUpdate({ docid: req.body.docid, trans_id: req.body.tid,payment_flag:0 }, { payment_flag: 1, payment_done_on: Date.now()}, { new: true }, function (err, doc) {
        if(err) {
            return res.status(500).send({errorCode:1,errorMsg:err||"Something went wrong while updating payment flag. Please try again later"});
        }
        
        if (doc !== null) {
            var rewardAmount = parseFloat(doc.amount)*0.10;
            var rewardIns = new paymentObj.rewardModel({
                docid: req.body.docid, ucode: req.body.ucode, reward: rewardAmount,rewardtype:1
            });
            rewardIns.save().then(data => {
                contractObj.update({ temp_docid: req.body.docid }, { paid: 1 }, { multi: true },function(err,numAffected) {
                    if (err) {
                       return res.status(500).send({errorCode: 1, errorMsg: err || "Som error occured while updating contract details paid flag"});
                    }
                    res.status(200).send({
                        errorCode: 0, errorMsg: "Reward Details Saved Successfully", data: { rewardAm: rewardAmount }
                    });
                })
            }).catch(e=>{
                res.status(500).send({
                    errorCode: 1, errorMsg: err.message || "Some error occurred while adding reward details."
                });
            });
        } else {
            res.status(400).send({
                errorCode: 1, errorMsg: "There is nothing to update. Please check again"
            });
        }
    });
}