const mongoose = require('mongoose');
const OtpSchema = mongoose.Schema({
    ucode: String,
    mobNo: String,
    otp:String,
    otpUseFlag:{type:String,default:'0'},
}, {
    timestamps: true
});
OtpSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 1200 });
module.exports = mongoose.model('tbl_reseller_otp', OtpSchema);