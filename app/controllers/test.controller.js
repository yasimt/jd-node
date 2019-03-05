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

class TestDataClass {

    async testEmail(req,res) {
        var thisObj = this;
        var retObj = {};
        try {
            retObj = {
                errorCode : 0,
                errorSatus : ''
            };
            if( ( !req.body.email || typeof req.body.email === 'undefined' ) || ( req.body.email && req.body.email == "" ) ){
                retObj = {
                    errorCode : 1,
                    errorSatus : 'parameters not send properly email'
                };
                return res.status(400).send(retObj);
            }
            try{
                var verifyEmailResp = await thisObj.verifyEmailTest(req.body.email);
                var myObj = {
                    resp:verifyEmailResp,
                    errorCode : 0,
                    errorSatus : 'Success'
                }
                return res.status(200).send(myObj);
            }catch(err){
                var myObj = {
                    err,
                    errorCode : 1,
                    errorSatus : 'Some excpetion 2'
                }
                return res.status(500).send(myObj);
            }
        }catch(err){
            retObj = {
                errorCode : 1,
                errorSatus : 'Some excetion : '+err
            };
            return res.status(400).send(retObj);
        }
    }
    // Function to validate email
    async verifyEmailTest(email) {
        return new Promise( (resolve,reject) => {
            verifier.verify(email, function( err, info ) {
                if( err ) {
                    // console.log(err);
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
};
module.exports = TestDataClass;