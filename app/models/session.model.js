var mongoose = require("mongoose");
const helperFunc = require('../utility/helperFunc.js');
const SessionSchema = mongoose.Schema({
    sess_uuid:String,
    session:Object,
    expiredOn:{type:Date,default:Date.now()}
},{timestamps:true});
SessionSchema.index({ "updatedAt":1},{expireAfterSeconds: 3600});
var sessObj = mongoose.model('col_session', SessionSchema);

const BearerSchema = mongoose.Schema({
    application_name: String,
    bearer_token: String,
    application_ip:String,
    ucode:String
}, { timestamps: true });
SessionSchema.index({ "application_id": 1,"bearer_token":2 });
var bearObj = mongoose.model('col_bearer_token', BearerSchema);

var setSessId = (initSess,cb) => {
    var sessId = helperFunc.generateUUID();
    var sessObjIns = new sessObj({
        sess_uuid:sessId,
        session: { ucode: initSess}
    });
    
    sessObjIns.save().then(data=>{
        var retObj = {};
        retObj['sessid']    =   sessId;
        retObj['errorCode']    =   0;
        retObj['errorMsg']    =   "returning session id";
        cb(retObj);
    }).catch(err=>{
        var retObj = {};
        retObj['errorCode']    =   1;
        retObj['errorMsg']    =   err||"Something went wrong while saving sessions";
        cb(retObj);
    });
}
exports.setSessId = setSessId;

var checkSessId = (sessid,cb)=>{
    sessObj.find({sess_uuid:sessid}).then(data=>{
        if(data.length > 0) {
            var retObj = { errorCode: 0, errorMsg: "Session is set", sessItem: data};
            cb(retObj);
        } else {
            var retObj = { errorCode: 1, errorMsg: "Session is not set" };
            cb(retObj);
        }
    }).catch(err=>{
        var retObj = {errorCode:1,errorMsg:"Session is not set"};
        cb(retObj);
    })
}
exports.checkSessId = checkSessId;

var updateSessTime = (sessid,cb) => {
    sessObj.update({ sess_uuid: sessid }, { expiredOn:Date.now()}).then(data => {
        cb({errorCode:0,errorMsg:"Time updated"});
    }).catch(err=>{
        cb({ errorCode: 1, errorMsg: err||"Something went wrong" });
    });
}
exports.updateSessTime  =   updateSessTime;

var destroySession = (sessid,cb) =>{
    sessObj.remove({sess_uuid:sessid}).then(data=>{
        cb({ errorCode: 0, errorMsg: "Session id destroyed" });
    }).catch(err=>{
        cb({ errorCode: 1, errorMsg: err || "Something went wrong" });
    });
}
exports.destroySession = destroySession;

var setSessItem =   (sessid,cb,itemJson)=>{
    console.log(sessid);
    sessObj.find({ sess_uuid: sessid }).then(data => {
        console.log(data);
        var sessDataObj = data[0].session;
        console.log(sessDataObj);
        var parseItemJson = itemJson;
        console.log(parseItemJson);
        for (var keySess in parseItemJson) {
            sessDataObj[keySess] = parseItemJson[keySess];
        }
        console.log(sessDataObj);
        sessObj.update({ sess_uuid: sessid }, { session: sessDataObj }, function (err, numAffected) {
            if (numAffected.nModified > 0) {
                cb({ errorCode: 0, errorMsg: "Session updated" });
            } else {
                cb({ errorCode: 1, errorMsg: "Nothing to update" });
            }
        });
    }).catch(err=>{
        cb({ errorCode: 1, errorMsg: err || "Something went wrong" });
    })
}
exports.setSessItem = setSessItem;

var checkBearToken = (beartoken,module)=>{
    return new Promise((resolve, reject) => {
        bearObj.find({bearer_token:beartoken}).then(data=>{
            var retObj = {};
            if (data.length > 0) {
                retObj['errorCode'] =   0;
                retObj['data'] =   data;
            } else {
                retObj['errorCode'] = 1;
            }
            resolve(retObj);
        }).catch(err=>{
            var retObj = {};
            retObj['errorCode'] = 1;
            reject(retObj);
        })
    })
}
exports.checkBearToken = checkBearToken;

var createBearToken = (ucode,module,allowedip,cb)=>{
    var beartoken = helperFunc.generateUUID();
    console.log(beartoken);
    var bearInsObj = new bearObj({
        application_name:module,
        bearer_token: beartoken,
        application_ip: allowedip,
        ucode:ucode        
    });
    bearInsObj.save().then(resp=>{
        var retObj = {};
        retObj['btoken'] = beartoken;
        retObj['errorCode'] = 0;
        retObj['errorMsg'] = "returning bear token";
        cb(retObj);
    }).catch(err=>{
        var retObj = {};
        retObj['errorCode'] = 1;
        retObj['errorMsg'] = err || "Something went wrong while saving sessions";
        cb(retObj);
    })
}
exports.createBearToken = createBearToken;