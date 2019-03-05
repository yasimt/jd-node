const referralObj = require('../models/referral.model.js');
const paths = require('../../config/paths.js');
const envObj = require('../../config/env.conf.js');
const helperFunc = require('../utility/helperFunc.js');
const curlObj = require('../utility/curlRequest.js');

exports.setReferral =   (req,res)=>{
    if(!req.body.ref_no || (req.body.ref_no && req.body.ref_no == "")) {
        return res.status(400).send({errorCode:1,errorMsg:"Please send referral number"});
    }
    if(!req.body.reff_code || (req.body.reff_code && req.body.reff_code == "")) {
        return res.status(400).send({errorCode:1,errorMsg:"Please send referrer code"});
    }
    if(!req.body.reff_mod || (req.body.reff_mod && req.body.reff_mod == "")) {
        return res.status(400).send({errorCode:1,errorMsg:"Please send referral module name"});
    }
    if (!req.body.data_city || (req.body.data_city && req.body.data_city == "")) {
        return res.status(400).send({errorCode:1,errorMsg:"Please send referral data city"});
    }
    referralObj.referralInsObj.find({ referrer_number: req.body.ref_no,accept_flag:1}).then(doc=>{
        if (doc.length == 0) {
            referralObj.referralInsObj.findOneAndUpdate({ referral_id: req.body.reff_code, referrer_number: req.body.ref_no,accept_flag:0 }, {referrer_module: req.body.reff_mod,reff_docid: req.body.docid,referrer_code: "",data_city:req.body.data_city},{upsert:true,new:true},function(error,doc){
                if(error) {
                    return res.status(500).send({ errorCode: 1, errorMsg: error || "Something went wrong while upserting referral." });
                }
                var smsUrl = paths.smsapi + "?source=Vc_Reseller&city_name=IDC&mobile=" + req.body.ref_no + "&DNDAllow=1&sms_text=http://172.29.86.26:3002/+is+your+OTP+for+JD+Reseller.&msg_id=D555CCA19C940218ACAD17ED44CD73C1&vcode=http://172.29.86.26:3002/";

                var retImgData = curlObj.curlCall('xxx', smsUrl, {}, 'get', function (resp) {
                    if (resp == 'success') {
                        res.status(200).send({ errorCode: 0, errorMsg: "Referral request inserted/updated and link sent to number" });    
                    } else {
                        res.status(500).send({
                            errorCode: 1, errorMsg: "Some error occurred while sending Link. But referral inserted"
                        });
                    }
                });
            });
        } else {
            return res.status(400).send({ errorCode: 1, errorMsg: "Referral already accept someone else's request" });
        }
    }).catch(err=>{
        return res.status(500).send({ errorCode: 1, errorMsg: err || "Something went wrong while finding referral." });
    })
}