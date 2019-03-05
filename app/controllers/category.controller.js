const usermodel = require('../models/contract.model.js');
const dbconfig = require("../../config/database.config.js");
const curlObj = require('../utility/curlRequest.js');
const paths = require('../../config/paths.js');
const helperFunc = require('../utility/helperFunc.js');
const md5 = require('md5');
const myObj = require('../utility/connect.mysql.js');
const os = require('os');
const mom = require('moment');

class CategoryDetails {
    async findCatParentage(req,res){
        if (!req.body.catidArr || (req.body.catArr && req.body.catArr   ==  "")) {
            return res.status(400).send({errorCode:1,errorMsg:"Please send Category Object"})
        }
        if (!req.body.data_city || (req.body.data_city && req.body.data_city == "")) {
            return res.status(400).send({ errorCode: 1, errorMsg: "Please send data city" })
        }
        var catIdlist   =   "";
        var catArr = JSON.parse(req.body.catidArr);
        for (var key in catArr) {
            catIdlist = catIdlist + catArr[key]+",";
        }
        catIdlist = catIdlist.slice(0,-1);
        var cityConnect =   "";
        if (helperFunc.mainCityArr.indexOf(req.body.data_city.toLowerCase()) == -1) {
            cityConnect = "remote";
        } else {
            cityConnect = req.body.data_city.toLowerCase();
        }
        
        var dbParam = dbconfig['local'][cityConnect];
        var mysqlObj = new myObj(dbParam);

        try{
            var catData = await mysqlObj.query("SELECT DISTINCT a.catid,a.category_name,b.parentlineage FROM tbl_categorymaster_generalinfo a join tbl_categorymaster_parentinfo b on a.catid=b.catid WHERE a.catid IN (" + catIdlist +") ORDER BY a.category_name");
        } catch(err) {
            return res.status(500).send({ errorCode: 1, errorMsg: err.stack });
        }
        if (catData.length > 0) {
            // console.log("catData : ", catData);
            var parent_arr  =   {};
            var i = 0;
            try{
                for(var key in catData) {
                    //var parentlineage_arr = explode("/", $row['parentlineage']);
                    var parentlineage_arr = catData[key]['parentlineage'].split("/");
                    var top_parent  =   "";
                    if (parentlineage_arr[1] && parentlineage_arr.length > 2 && parentlineage_arr[1].toUpperCase() != 'UNALLOTED CATEGORY' && parentlineage_arr[1].toUpperCase() != 'CATEGORY WITHOUT PARENT FROM OTHER CITY') {
                        top_parent = parentlineage_arr[1];
                    } else {
                        top_parent = "Parentless";
                    }
                    //var par_name = trim(ucwords(strtolower($top_parent)));
                    var par_name = ((top_parent.toLowerCase()).toUpperCase()).trim();
                    if (typeof parent_arr[par_name]   === 'undefined') {
                        parent_arr[par_name]    =   {};
                    }
                    parent_arr[par_name][i] =   {};
                    parent_arr[par_name][i]['catid'] = catData[key]['catid'];
                    parent_arr[par_name][i]['catname'] = catData[key]['category_name'];
                    i++;
                }
                if (typeof parent_arr['Parentless'] !== 'undefined' && parent_arr['Parentless'].length > 0) {
                    for (var keyArr in parent_arr) {
                        if(keyArr   =   "Parentless") {
                            for (var keyInArr in parent_arr[keyArr]) {
                                for (var keyParentArr in parent_arr['Parentless']) {
                                    if (parent_arr[keyArr][keyInArr]['catid'] == parent_arr['Parentless'][keyParentArr]['catid']) {
                                        delete parent_arr['Parentless'][keyParentArr];
                                    }
                                }
                            }
                        }
                    }
                }    
                return res.status(200).send({ errorCode: 0, errorMsg: "Data returned Successfully", data: parent_arr });  
            } catch(err) {
                return res.status(500).send({ errorCode: 1, errorMsg: err.stack });
            }
        }
    }
    async insrtCatDataLite(req,res) {
        var retArr = {};
        try{
            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "Data City is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
                retArr = {errorCode:1,errorStatus: "module is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retArr = {errorCode:1,errorStatus: "parentid is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.empcode) ) {
                retArr = {errorCode:1,errorStatus: "empcode is blank"};
                return res.status(400).send(retArr);
            }
            // var catids = req.body.catId;
            // catids = catids.replace(/,\s*$/, "");
            var parentid = req.body.parentid;
            var module = req.body.module;
            var data_city = req.body.data_city;
            var catArr = [];
            
            var postData = {};
            postData['data'] = {};
            postData['data']['empcode'] = req.body.empcode;
            postData['data']['parentid'] = parentid;
            postData['data']['data_city'] = data_city.toLowerCase();
            postData['data']['module'] = module.toUpperCase();
            postData['data']['table'] = 'tbl_business_temp_data';
            var curlTimeOut = {timeout:8000};
            var getalldata = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/getdata",postData,'post',{},curlTimeOut);
            getalldata = JSON.parse(getalldata);
            // console.log("getalldata :",getalldata);
            // return;
            if( typeof getalldata['data'] !== 'undefined' &&  getalldata['data'] ) {
                console.log("tbl_business_temp_data : ",getalldata['data']['catIds']);
                var newCatStr = getalldata['data']['catIds'];
                console.log("getalldata :",newCatStr);
                var param_business_temp_data = {
                    updatedata:{
                        dealCloseCatid : newCatStr
                    }
                }
                var insertionObj = {
                        data :{
                        parentid:parentid,
                        data_city:data_city,
                        module:module,
                        table_data : JSON.stringify({tbl_business_temp_data: param_business_temp_data
                        })
                    }
                };
                try{
                    var curlTimeOut = {timeout:8000};
                    var inertDataAPIResp = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/insertdata",insertionObj,'post',{},curlTimeOut);
                    if( typeof inertDataAPIResp !== "undefined" ) {
                        inertDataAPIResp = JSON.parse(inertDataAPIResp);
                        if( inertDataAPIResp.error == 0 ) {
                            var retArr = {
                                errorCode : 0,
                                errorStatus : 'Data Inserted success'
                            };
                            return res.status(200).send(retArr);
                        } else {
                            var retArr = {
                                errorCode : 1,
                                errorStatus : 'Data Insertion Failed'
                            };
                            return res.status(500).send(retArr);
                        }
                    } else {
                        var retArr = {
                            errorCode : 1,
                            errorStatus : 'Data Insertion Failed'
                        };
                        return res.status(500).send(retArr);
                    }
                }catch(err) {
                    var retArr = {
                        errorCode : 1,
                        errorStatus : 'Data Insertion Failed '+err
                    };
                    return res.status(500).send(retArr);
                }
            }
        }catch(e) {
            retArr = {
                errorCode : 1,
                errorStatus : e.stack
            }
            return res.status(500).send(retArr)
        }
        //deal_close_cat        
    }
    async updateCatIds(req,res) {
        var retArr = {};
        try{
            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "Data City is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
                retArr = {errorCode:1,errorStatus: "module is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retArr = {errorCode:1,errorStatus: "parentid is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.empcode) ) {
                retArr = {errorCode:1,errorStatus: "empcode is blank"};
                return res.status(400).send(retArr);
            }
            // var catids = req.body.catId;
            // catids = catids.replace(/,\s*$/, "");
            var parentid = req.body.parentid;
            var module = req.body.module;
            var data_city = req.body.data_city;
            var catArr = [];
            
            var postData = {};
            postData['data'] = {};
            postData['data']['empcode'] = req.body.empcode;
            postData['data']['parentid'] = parentid;
            postData['data']['data_city'] = data_city.toLowerCase();
            postData['data']['module'] = module.toUpperCase();
            postData['data']['table'] = 'tbl_business_temp_data';
            var curlTimeOut = {timeout:8000};
            var getalldata = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/getdata",postData,'post',{},curlTimeOut);
            getalldata = JSON.parse(getalldata);
            // console.log("getalldata :",getalldata);
            // return;
            if( typeof getalldata['data'] !== 'undefined' &&  getalldata['data'] ) {
                console.log("tbl_business_temp_data : ",getalldata['data']['dealCloseCatid']);
                if( helperFunc.undefNullEmptyCheck(getalldata['data']['dealCloseCatid']) ) {

                    var newCatStr = getalldata['data']['dealCloseCatid'];
                    console.log("getalldata :",newCatStr);
                    var catArr = newCatStr.split("|P|");
                    console.log("catArr : ",catArr);
                    var listOfCatIds = "";
                    for( var x in catArr ) {
                        console.log('catArr["x"] : ',catArr[x]);
                        if( catArr[x] != "" ) {
                            let catid = catArr[x].replace(/^\/|\/$/g, '');
                            listOfCatIds =  listOfCatIds+catid.toString()+',';
                        }
                    }
                    listOfCatIds = listOfCatIds.replace(/,\s*$/, "");
                    var curlTimeOut = {timeout:8000};
                    var getCatNameUrl = paths.jdboxurl+'/services/category_data_api.php'+'?city='+encodeURI(req.body.data_city)+'&module='+req.body.module+'&where={"catid":"'+listOfCatIds+'"}&return=catid,category_name,national_catid,auth_gen_ncatid&orderby=callcount desc';
                    var newObj = {url:getCatNameUrl};
                    var finalDispObj = {};
                    var catArr = [];
                    var parsedResp;
                    var catnames_str = "";
                    var catIds_str = "";
                    var national_catids_str = "";
                    var catSelected = "";
                    var catidArr = [];
                    var catidNameArr = [];
                    var nationalcatidArr = [];
                    var catSelectedArr = [];
                    try {
                        var getCatDetailAPIResp = await curlObj.curlCall('xxx', getCatNameUrl, {},'get',curlTimeOut);
                        if( helperFunc.undefNullEmptyCheck(getCatDetailAPIResp) ) {
                            parsedResp = JSON.parse(getCatDetailAPIResp);
                            if( parsedResp['errorcode'] == 0 ) {
                                console.log("Data Found");
                                if ( helperFunc.undefNullEmptyCheck(parsedResp['results']) ) {
                                    catnames_str = '|P|';
                                    catIds_str = '|P|';
                                    national_catids_str = '|P|';
                                    catSelected = '|~|';
                                    for(var y in parsedResp['results'] ) {
                                        let catid = parsedResp['results'][y]['catid'].trim();
                                        catidArr.push(catid);
                                        let category_name = parsedResp['results'][y]['category_name'].trim();
                                        catidNameArr.push(category_name);
                                        catSelectedArr.push(category_name);
                                        let national_catid = parsedResp['results'][y]['national_catid'].trim();
                                        nationalcatidArr.push(national_catid);
                                        let catObj = {};
                                        catObj[catid] = {catname:category_name,national_catid:national_catid};
                                        catArr.push(catObj);                                    
                                    }
                                    if( catidArr.length > 0 ) {
                                        catIds_str = catIds_str+catidArr.join('|P|');
                                    }
                                    if( catidNameArr.length > 0 ) {
                                        catnames_str = catnames_str+catidNameArr.join('|P|');
                                        catSelected = catSelected+catSelectedArr.join('|~|');
                                    }
                                    if( nationalcatidArr.length > 0 ) {
                                        national_catids_str = national_catids_str+nationalcatidArr.join('|P|');
                                    }
                                }
                            }
                        }
                        // finalDispObj = {catArr,parsedResp,catIds_str,catnames_str,national_catids_str,catSelected};
                        // Write Insertion Code here
                        var param_business_temp_data = {
                            updatedata:{
                                categories : catnames_str,
                                catIds : catIds_str,
                                nationalcatIds : national_catids_str,
                                catSelected : catSelected,
                            }
                        }
                        var insertionObj = {
                                data :{
                                parentid:parentid,
                                data_city:data_city,
                                module:module,
                                table_data : JSON.stringify({tbl_business_temp_data: param_business_temp_data
                                })
                            }
                        };
                        try{
                            var curlTimeOut = {timeout:8000};
                            var inertDataAPIResp = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/insertdata",insertionObj,'post',{},curlTimeOut);
                            if( typeof inertDataAPIResp !== "undefined" ) {
                                inertDataAPIResp = JSON.parse(inertDataAPIResp);
                                if( inertDataAPIResp.error == 0 ) {
                                    var retArr = {
                                        errorCode : 0,
                                        errorStatus : 'Data Inserted success'
                                    };
                                    return res.status(200).send(retArr);
                                } else {
                                    var retArr = {
                                        errorCode : 1,
                                        errorStatus : 'Data Insertion Failed'
                                    };
                                    return res.status(500).send(retArr);
                                }
                            } else {
                                var retArr = {
                                    errorCode : 1,
                                    errorStatus : 'Data Insertion Failed'
                                };
                                return res.status(500).send(retArr);
                            }
                        }catch(err) {
                            var retArr = {
                                errorCode : 1,
                                errorStatus : 'Data Insertion Failed '+err
                            };
                            return res.status(500).send(retArr);
                        }
                    } catch(e) {
                        finalDispObj = {errorStatus:e.stack,errorCode:1};
                        return res.status(500).send(finalDispObj);
                    }
                }else{
                    
                    retArr = {errorCode:1,errorStatus:'Change in Categories Found, Kindly Re-Calculate Budget and Proceed'};
                    return res.status(400).send(retArr);
                }
            }else{
                // No Update Required
                retArr = {errorCode:1,errorStatus:'Change in Categories Found, Kindly Re-Calculate Budget and Proceed'};
                return res.status(400).send(retArr);
            }
        }catch(e) {
            retArr = {
                errorCode : 1,
                errorStatus : e.stack
            }
            return res.status(500).send(retArr)
        }
    }

    async extactRenewalUpdateCats(req,res) {
        var retArr = {};
        try {

            if ( !helperFunc.undefNullEmptyCheck(req.body.data_city) ) {
                retArr = {errorCode:1,errorStatus: "Data City is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.module) ) {
                retArr = {errorCode:1,errorStatus: "module is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.parentid) ) {
                retArr = {errorCode:1,errorStatus: "parentid is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.empcode) ) {
                retArr = {errorCode:1,errorStatus: "empcode is blank"};
                return res.status(400).send(retArr);
            }
            if ( !helperFunc.undefNullEmptyCheck(req.body.catIds) ) {
                retArr = {errorCode:1,errorStatus: "catIds is blank"};
                return res.status(400).send(retArr);
            }
            var parentid = req.body.parentid;
            var module = req.body.module;
            var data_city = req.body.data_city;
            var catIds = req.body.catIds;
            var catArr = [];
            catIds = catIds.replace(/,\s*$/, "");
            if( catIds.indexOf(",") > -1 ) {
                catArr = catIds.split(",");
            }else{
                catArr.push(catIds);
            }
            var listOfCatIds = '';
            for( var x in catArr ) {
                console.log('catArr["x"] : ',catArr[x]);
                if( catArr[x] != "" ) {
                    let catid = catArr[x].replace(/^\/|\/$/g, '');
                    listOfCatIds =  listOfCatIds+catid.toString()+',';
                }
            }
            listOfCatIds = listOfCatIds.replace(/,\s*$/, "");
            var curlTimeOut = {timeout:8000};
            var getCatNameUrl = paths.jdboxurl+'/services/category_data_api.php'+'?city='+encodeURI(req.body.data_city)+'&module='+req.body.module+'&where={"catid":"'+listOfCatIds+'"}&return=catid,category_name,national_catid,auth_gen_ncatid&orderby=callcount desc';
            var newObj = {url:getCatNameUrl};
            var finalDispObj = {};
            var catArr = [];
            var parsedResp;
            var catnames_str = "";
            var catIds_str = "";
            var national_catids_str = "";
            var catSelected = "";
            var catidArr = [];
            var catidNameArr = [];
            var nationalcatidArr = [];
            var catSelectedArr = [];
            try {
                var getCatDetailAPIResp = await curlObj.curlCall('xxx', getCatNameUrl, {},'get',curlTimeOut);
                if( helperFunc.undefNullEmptyCheck(getCatDetailAPIResp) ) {
                    parsedResp = JSON.parse(getCatDetailAPIResp);
                    if( parsedResp['errorcode'] == 0 ) {
                        console.log("Data Found");
                        if ( helperFunc.undefNullEmptyCheck(parsedResp['results']) ) {
                            catnames_str = '|P|';
                            catIds_str = '|P|';
                            national_catids_str = '|P|';
                            catSelected = '|~|';
                            for(var y in parsedResp['results'] ) {
                                let catid = parsedResp['results'][y]['catid'].trim();
                                catidArr.push(catid);
                                let category_name = parsedResp['results'][y]['category_name'].trim();
                                catidNameArr.push(category_name);
                                catSelectedArr.push(category_name);
                                let national_catid = parsedResp['results'][y]['national_catid'].trim();
                                nationalcatidArr.push(national_catid);
                                let catObj = {};
                                catObj[catid] = {catname:category_name,national_catid:national_catid};
                                catArr.push(catObj);                                    
                            }
                            if( catidArr.length > 0 ) {
                                catIds_str = catIds_str+catidArr.join('|P|');
                            }
                            if( catidNameArr.length > 0 ) {
                                catnames_str = catnames_str+catidNameArr.join('|P|');
                                catSelected = catSelected+catSelectedArr.join('|~|');
                            }
                            if( nationalcatidArr.length > 0 ) {
                                national_catids_str = national_catids_str+nationalcatidArr.join('|P|');
                            }
                        }
                    }
                }
                // finalDispObj = {catArr,parsedResp,catIds_str,catnames_str,national_catids_str,catSelected};
                // Write Insertion Code here
                var param_business_temp_data = {
                    updatedata:{
                        categories : catnames_str,
                        catIds : catIds_str,
                        nationalcatIds : national_catids_str,
                        catSelected : catSelected,
                    }
                }
                var insertionObj = {
                        data :{
                        parentid:parentid,
                        data_city:data_city,
                        module:module,
                        table_data : JSON.stringify({tbl_business_temp_data: param_business_temp_data
                        })
                    }
                };
                try{
                    var curlTimeOut = {timeout:8000};
                    var inertDataAPIResp = await curlObj.curlCall('xxx', paths.bformMongurl+"api/shadowinfo/insertdata",insertionObj,'post',{},curlTimeOut);
                    if( typeof inertDataAPIResp !== "undefined" ) {
                        inertDataAPIResp = JSON.parse(inertDataAPIResp);
                        if( inertDataAPIResp.error == 0 ) {
                            var retArr = {
                                errorCode : 0,
                                errorStatus : 'Data Inserted success'
                            };
                            return res.status(200).send(retArr);
                        } else {
                            var retArr = {
                                errorCode : 1,
                                errorStatus : 'Data Insertion Failed'
                            };
                            return res.status(400).send(retArr);
                        }
                    } else {
                        var retArr = {
                            errorCode : 1,
                            errorStatus : 'Data Insertion Failed'
                        };
                        return res.status(400).send(retArr);
                    }
                }catch(err) {
                    var retArr = {
                        errorCode : 1,
                        errorStatus : 'Data Insertion Failed '+err
                    };
                    return res.status(500).send(retArr);
                }
            } catch(e) {
                finalDispObj = {errorStatus:e.stack,errorCode:1};
                return res.status(500).send(finalDispObj);
            }
        }catch(err) {
            retArr = {errorCode : 1,errorStatus:e.stack};
            res.status(400).send(retArr);
        }

    }
}
module.exports = CategoryDetails; 
