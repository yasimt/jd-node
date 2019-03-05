const contractmodel = require('../models/autosuggest.model.js');
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const cityArr = ['mumbai','delhi','kolkata','bangalore','chennai','pune','hyderabad','ahmedabad'];
exports.cityAuto = (req, res) => {
    if (!req.body.searchstr || (req.body.searchstr && req.body.searchstr == "")) {
        return res.status(400).send({
            errorCode: 1, errorMsg: "Search String not passed"
        });
    }
    if (!req.body.server_city || (req.body.server_city && req.body.server_city == "")) {
        return res.status(400).send({
            errorCode: 1, errorMsg: "Server City not passed"
        });
    }
    var formData = {
        data: { search_str: req.body.searchstr, server_city: req.body.server_city }
    };
    curlObj.curlCall('xxx', paths.meservices + "/locationInfo/get_city", formData,'json',function(resp){
        var parseResp = JSON.parse(resp);
        if (parseResp.errorCode == 0) {
            res.json({ errorCode: 0, errorMsg: "Data Found", data: parseResp['data']});
        } else {
            res.status(502).send({
                errorCode: 1, errorMsg: "Data Not Found"
            });
        }
    });
}

exports.pincodeAuto = (req, res) => {
    if (!req.body.searchstr || (req.body.searchstr && req.body.searchstr == "")) {
        return res.status(400).send({
            errorCode: 1, errorMsg: "Search String not passed"
        });
    }
    
    var formData = {
        data: { server_city: 'remote',city:req.body.city,area:'',pin_auto:req.body.searchstr }
    };
    
    curlObj.curlCall('xxx', paths.meservices + "/locationInfo/pincode_master", formData, 'json', function (resp) {
        var parseResp = JSON.parse(resp);
        console.log(parseResp);
        if (parseResp.errorCode == 0) {
            res.json({ errorCode: 0, errorMsg: "Data Found", data: parseResp['data'],city:parseResp['city']});
        } else {
            res.status(502).send({
                errorCode: 1, errorMsg: "Data Not Found"
            });
        }
    });
}

exports.contractAuto = (req,res) => {
    if (!req.body.city || (req.body.city && req.body.city == "")) {
        return res.status(400).send({
            errorCode: 1, errorMsg: "City not passed"
        });
    }
    if (!req.body.searchstr || (req.body.searchstr && req.body.searchstr == "")) {
        return res.status(400).send({
            errorCode: 1, errorMsg: "Search String not passed"
        });
    }
    if (cityArr.indexOf(req.body.city.toLowerCase()) > -1) {
        var cityApi = paths[req.body.city.toLowerCase() + 'iro'];
    } else {
        var cityApi = paths['remoteiro'];
    }
    curlObj.curlCall('xxx', cityApi + "/mvc/autosuggest/compcat?dcity=" + req.body.city.toLowerCase() + "&scity=" + req.body.city.toLowerCase() + "&search=" + req.body.searchstr.toLowerCase() +"&type=1&mod=ME&nflag=&stflag=&dflag=&debug=0",{}, 'get', function (resp) {
        var parsedJson = JSON.parse(resp);
        if (parsedJson['errors']['code'] == 0 && parsedJson['results']['data'].length > 0) {
            res.json({ errorCode: 0, errorMsg: "Data Found", data: parsedJson['results']['data'] });
        } else {
            res.status(502).send({
                errorCode: 1, errorMsg: "Data Not Found"
            });
        }
    });
}