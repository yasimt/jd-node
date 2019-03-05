const mongoose = require('mongoose');
const ReferralSchema = mongoose.Schema({
    referral_id:String,
    referrer_number:String,
    referrer_module:String,
    reff_docid:String,
    accept_flag:{type:Number,default:0},
    referrer_code:String,
    data_city:String,
    name:String,
    accept_type_flag:{type:Number,default:0}//1-Same number as reseller reffred,2- Not the same number as reseller referred
}, {
    timestamps: true
});
ReferralSchema.index({ "referrer_number": 1,"updatedAt":3});
exports.referralInsObj = mongoose.model('col_referral_details', ReferralSchema);

const ShortCodeSchema = mongoose.Schema({
    short_id:String,
    refferer_id:String,
    referral_type:{type:Number,default:0} // 0- default,1-individual resellr invite , 2- business reseller invite
},{
    timestamps:true
});
ShortCodeSchema.index({ "short_id": 1, "referrer_id": 2 });
exports.shortCodeInsObj = mongoose.model('col_shortcode_details', ShortCodeSchema);

const TempMainReselSchema = mongoose.Schema({
    temp_id: String,
    main_id: String,
    active_flag:{type:Number,default:0}
}, {
    timestamps: true
});
TempMainReselSchema.index({ "temp_id": 1, "main_id": 2 });
exports.tempMainReselInsObj = mongoose.model('col_tempmain_mapping', TempMainReselSchema);