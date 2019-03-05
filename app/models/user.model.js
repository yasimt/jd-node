const mongoose = require('mongoose');
const UserSchema = mongoose.Schema({
    ucode: String,
    uname:String,
    mobNo: String,
    email:String,
    city:String,
    profile_flag:{type:Number,default:'0'},//0- nothing, 1- individual, 2 - business owner
    active_flag:{type:Number,default:'0'},
    refferal_flag:{type:Number,default:'0'},//0 - fresh paid reseller, 1 - refferal reseller by business,2- referral reseller by individual
    otp:{type:String,default:''}
}, {
    timestamps: true
});
UserSchema.index({ "ucode": 1, "createdAt": 2, "updatedAt": 3 });
exports.userModel = mongoose.model('tbl_reseller_info', UserSchema);

const LoginSchema = mongoose.Schema({
    ucode:String,
    login_flag:{type:Number,default:0},
    login_time:Date,
    logout_time:Date
}, {
    timestamps: true
});
exports.LoginModel = mongoose.model('col_reseller_login', LoginSchema);

const KycSchema = mongoose.Schema({
    ucode:String,
    lic_no:{type:String,default:""},
    adhar: { type: String, default: ""},
    pass_no: { type: String, default: ""},
    panCard: {type: String, default: ""}
}, {
    timestamps: true
});
KycSchema.index({ "ucode": 1});
exports.KycModel = mongoose.model('col_reseller_kyc', KycSchema);