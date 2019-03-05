const mongoose = require('mongoose');

const PaymentResellerSchema = mongoose.Schema({
    resellerid: String,
    amount: { type: Number, default: 0 },
    payment_flag: { type: Number, default: 0 },//0- payment not done,1-payment done,2-new payment amount, this is invalid,3-payment failed
    trans_id: { type: String, default: '' },
    payment_mode: { type: String, default: '' },
    payment_det: Object,
    payment_done_on: { type: Date, default: '' }
}, {
    timestamps: true
});
exports.paymentResellerModel = mongoose.model('col_payment_info_reseller', PaymentResellerSchema);

const PaymentSchema = mongoose.Schema({
    docid: String,
    amount:{type:Number,default:0},
    tenure: String,
    payment_flag:{type:Number,default:0},//0- payment not done,1-payment done,2-new payment amount, this is invalid,3-payment failed
    trans_id: { type: String, default: '' },
    ucode:String,
    payment_mode:{type:String,default:''},
    payment_det:Object,
    payment_done_on: {type:Date,default:''},
    process_amount:{type:Number,default:0}
}, {
    timestamps: true
});
exports.paymentInfoModel = mongoose.model('col_payment_info', PaymentSchema);

const RewardDetailSchema = mongoose.Schema({
    ucode:String,
    docid:String,
    reward:{type:Number,default:0},
    rewardtype: { type: Number, default: 0 },//1-self created contract,2-referal created contract,3-Chain Referal
    rewardlineage:{type:String,default:''},
    rewardee:{type:String,default:''}
}, {
    timestamps: true
});
exports.rewardModel = mongoose.model('col_reward_details',RewardDetailSchema);