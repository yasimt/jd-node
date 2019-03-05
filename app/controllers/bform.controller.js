const {
  isEmpty,
  isJSON,
  trimObj,
  addSlashes,
  stripslashes,
  validateCategories,
  capitalize
} = require(__basedir + "/app/utility/helperFunc");
const curlObj = require(__basedir + "/app/utility/curlRequest");
const validateBformInput = require(__basedir + "/common/bform_validation");
const CategoryClass = require(__basedir + "/common/category.class");
const SMSEmailClass = require(__basedir + "/common/smsemail.class");
const asyncMiddleware = require(__basedir + "/app/utility/async");
const textlog = require(__basedir + "/common/textlog");
const ConnCity = require(__basedir + "/config/conncity");
const conf = require(__basedir + "/config/database.config.js"); // configuration variables
const dbcon = require(__basedir + "/config/db.js");
const URLINFO = require(__basedir + "/common/geturl");
const moment = require("moment");
const md5 = require("md5");
var _ = require("lodash");
exports.tempDetails = asyncMiddleware(async (req, res) => {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }
  let debug = 0;
  if (!isEmpty(req.body.debug)) {
    debug = req.body.debug;
  }
  let logsec = 5;
  if (!isEmpty(req.body.logsec)) {
    logsec = req.body.logsec;
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const ucode = req.body.ucode;
  let team_type = "";
  if (req.body.team_type) {
    team_type = req.body.team_type.toLowerCase();
  }
  let url_info = URLINFO(data_city);
  //Fetching Connection City
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;

    const conn_iro = conf["iro"][conn_city];
    const conn_local = conf["local"][conn_city];
    const conn_tme = conf["tme_jds"][conn_city];
    const conn_idc = conf["idc"][conn_city];
    const conn_fin = conf["finance"][conn_city];

    let debug_resp = {};
    let start_time = [];
    let end_time = [];
    let taken_time = [];

    debug_resp["Process Start Time"] = moment().format("H:mm:ss");
    start_time[1] = new Date();

    // Shadow Table Data

    let shadow_data = {};

    let mongo_data = {};
    mongo_data["data"] = {};
    mongo_data["data"]["parentid"] = parentid;
    mongo_data["data"]["data_city"] = data_city;
    mongo_data["data"]["module"] = module;
    mongo_data["data"]["table"] = JSON.stringify({
      tbl_companymaster_generalinfo_shadow:
        "sphinx_id,parentid,companyname,building_name,street,landmark,country,state,city,area,pincode,latitude,longitude,geocode_accuracy_level,landline,email,email_feedback,email_display,mobile,mobile_display,mobile_feedback,mobile_admin,contact_person,fax,tollfree,email,sms_scode,website,paid,othercity_number,data_city",
      tbl_companymaster_extradetails_shadow:
        "parentid,working_time_start,working_time_end,social_media_url,award,testimonial,proof_establishment,payment_type,turnover,year_establishment,updatedBy,updatedOn,landline_addinfo,mobile_addinfo,statement_flag,fb_prefered_language,catidlineage_nonpaid,tag_line,certificates,no_employee,accreditations",
      tbl_business_temp_data: "catIds,nationalcatIds"
    });

    let mongo_url = url_info["mongo_url"] + "api/shadowinfo/getshadowdata";
    shadow_data = await curlObj.curlCall(
      "xxx",
      mongo_url,
      mongo_data,
      "post",
      {}
    );

    end_time[1] = new Date();
    taken_time[1] = (end_time[1].getTime() - start_time[1].getTime()) / 1000;
    debug_resp["1"] = {};
    debug_resp["1"]["action"] = "Mongo API Call";
    debug_resp["1"]["time"] = moment().format("H:mm:ss");
    debug_resp["1"]["takentime"] = taken_time[1];

    let tempdata = {};

    let temp_catlin_arr = [];
    let temp_catlin_np_arr = [];
    let all_temp_catids_arr = [];

    let catInfo = {};

    let stdInfo = {};
    let notific = {};
    if (Object.keys(shadow_data).length > 0) {
      shadow_data = JSON.parse(shadow_data);
      if (shadow_data["error"] == 0) {
        tempdata = shadow_data["data"];
        if (!isEmpty(tempdata["tbl_business_temp_data"])) {
          if (!isEmpty(tempdata["tbl_business_temp_data"]["catIds"])) {
            temp_catlin_arr = tempdata["tbl_business_temp_data"][
              "catIds"
            ].split("|P|");
            temp_catlin_arr = validateCategories(temp_catlin_arr);
          }
        }
        if (!isEmpty(tempdata["tbl_companymaster_extradetails_shadow"])) {
          if (
            !isEmpty(
              tempdata["tbl_companymaster_extradetails_shadow"][
                "catidlineage_nonpaid"
              ]
            )
          ) {
            tempdata["tbl_companymaster_extradetails_shadow"][
              "catidlineage_nonpaid"
            ] = _.trim(
              tempdata["tbl_companymaster_extradetails_shadow"][
                "catidlineage_nonpaid"
              ],
              ","
            );

            temp_catlin_np_arr = tempdata[
              "tbl_companymaster_extradetails_shadow"
            ]["catidlineage_nonpaid"]
              .replace(/\//g, "")
              .split(",");
            temp_catlin_np_arr = validateCategories(temp_catlin_np_arr);
          }
        }
        all_temp_catids_arr = _.uniq(
          _.concat(temp_catlin_arr, temp_catlin_np_arr)
        );

        if (all_temp_catids_arr.length > 0) {
          let catids_str = all_temp_catids_arr.join(",");
          catInfo = dbcon.db_query({
            conn: conn_local,
            query:
              "SELECT catid,category_name,display_product_flag FROM tbl_categorymaster_generalinfo WHERE catid IN (" +
              catids_str +
              ")"
          });
        }

        let genpin =
          tempdata["tbl_companymaster_generalinfo_shadow"]["pincode"];

        let gendcity =
          tempdata["tbl_companymaster_generalinfo_shadow"]["data_city"];
        let stdcond = "";
        if (parseInt(genpin) > 0) {
          stdcond = " AND pincode	=	'" + genpin + "'";
        } else {
          stdcond = " AND data_city	=	'" + gendcity + "'";
        }
        stdInfo = dbcon.db_query({
          conn: conn_local,
          query:
            "SELECT stdcode FROM tbl_areamaster_consolidated_v3 WHERE display_flag = 1 " +
            stdcond +
            " LIMIT 1"
        });

        start_time[2] = new Date();

        let mobilNo =
          tempdata["tbl_companymaster_generalinfo_shadow"]["mobile"];

        if (mobilNo != "") {
          let notific_url =
            "http://notifications.justdial.com/newnotify/UserStatus.php?udids=" +
            mobilNo +
            "&mobtyp=2&isdcode=0091";
          notific = curlObj.curlCall("xxx", notific_url, {}, "get", {});
        }

        end_time[2] = new Date();
        taken_time[2] =
          (end_time[2].getTime() - start_time[2].getTime()) / 1000;
        debug_resp["2"] = {};
        debug_resp["2"]["action"] = "Notification API";
        debug_resp["2"]["time"] = moment().format("H:mm:ss");
        debug_resp["2"]["takentime"] = taken_time[2];
      } else if (shadow_data["error"] == 1) {
        return res
          .status(500)
          .json({error: {code: 1, msg: shadow_data["msg"]}});
      } else {
        return res.status(500).json({
          error: {code: 1, msg: "Not getting response from MONGO API"}
        });
      }
    } else {
      return res
        .status(500)
        .json({error: {code: 1, msg: "Not getting response from MONGO API"}});
    }

    tempdata["all_temp_catids"] = all_temp_catids_arr;

    const empInfo = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT allocId,mobile,emailId,city,dnc_type FROM mktgEmpMaster WHERE mktEmpCode = '" +
        ucode +
        "' "
    });
    start_time[3] = new Date();
    const tmeSrch = await dbcon.db_query({
      conn: conn_local,
      query: "SELECT * FROM tbl_tmesearch WHERE parentid = '" + parentid + "' "
    });

    let extnInfo = {};
    if (Object.keys(tmeSrch).length > 0) {
      if (tmeSrch[0]["data_source"] == "Joinfree-Websit") {
        let extn_url = url_info["jdbox_url"] + "services/location_api.php";
        let extndata = {};
        extndata["data"] = {};
        extndata["data"]["rquest"] = "get_extention";
        extndata["data"]["parentid"] = parentid;
        extndata["data"]["data_city"] = data_city;
        extndata["data"]["module"] = module;
        extnInfo = curlObj.curlCall("xxx", extn_url, extndata, "post", {});
      }
    }
    end_time[3] = new Date();
    taken_time[3] = (end_time[3].getTime() - start_time[3].getTime()) / 1000;
    debug_resp["3"] = {};
    debug_resp["3"]["action"] = "After tmesearch / location_api";
    debug_resp["3"]["time"] = moment().format("H:mm:ss");
    debug_resp["3"]["takentime"] = taken_time[3];
    const ownerInfo = {};

    start_time[4] = new Date();
    const deliv = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT parentid FROM tbl_jdrr_delivered WHERE parentid = '" +
        parentid +
        "' "
    });

    const prefLang = dbcon.db_query({
      conn: conn_iro,
      query: "SELECT * FROM tbl_language_master WHERE active_flag = '1'"
    });

    const feedbackLog = dbcon.db_query({
      conn: conn_tme,
      query:
        "SELECT reason FROM tbl_sms_feedback_deactive_log WHERE parentid = '" +
        parentid +
        "' ORDER BY deactive_date DESC LIMIT 1"
    });

    const finInfo = dbcon.db_query({
      conn: conn_fin,
      query:
        "SELECT campaignid,budget,balance,bid_perday,expired,expired_on,duration FROM tbl_companymaster_finance WHERE parentid = '" +
        parentid +
        "' "
    });

    const compSrc = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT * FROM tbl_company_source WHERE parentid = '" +
        parentid +
        "' ORDER BY csid DESC LIMIT 1 "
    });

    const clientWait = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT parentid FROM tbl_walkin_client_details WHERE tmecode = '" +
        ucode +
        "' AND (final_status = '' OR final_status IS NULL) LIMIT 1"
    });

    const clientVisit = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT parentid as contractid,companyname,start_time FROM tbl_walkin_client_details WHERE parentid = '" +
        parentid +
        "' AND tmecode = '" +
        ucode +
        "' AND (final_status = '' OR final_status IS NULL) ORDER BY allocated_date DESC LIMIT 1"
    });

    const instr = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT instruction FROM tblContractAllocation WHERE contractCode = '" +
        parentid +
        "'  AND allocationType ='22' ORDER BY allocationTime DESC LIMIT 1"
    });

    const genMain = dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT sphinx_id,parentid,companyname,building_name,street,landmark,country,state,city,area,subarea,pincode,latitude,longitude,geocode_accuracy_level,landline,email,email_feedback,email_display,mobile,mobile_display,mobile_feedback,contact_person,fax,tollfree,email,sms_scode,website,paid,othercity_number,data_city FROM tbl_companymaster_generalinfo WHERE parentid = '" +
        parentid +
        "' "
    });

    const extraMain = dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT parentid,working_time_start,working_time_end,catidlineage,updatedBy,updatedOn,mask,freeze FROM tbl_companymaster_extradetails WHERE parentid = '" +
        parentid +
        "' "
    });

    const idGen = dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT * FROM tbl_id_generator WHERE parentid = '" + parentid + "' "
    });

    const genioByPass = dbcon.db_query({
      conn: conn_idc,
      query:
        "SELECT empcode FROM online_regis.tbl_bypassgeniolite_access WHERE empcode='" +
        ucode +
        "'"
    });

    end_time[4] = new Date();
    taken_time[4] = (end_time[4].getTime() - start_time[4].getTime()) / 1000;
    debug_resp["4"] = {};
    debug_resp["4"]["action"] = "Before Promise All";
    debug_resp["4"]["time"] = moment().format("H:mm:ss");
    debug_resp["4"]["takentime"] = taken_time[4];

    start_time[5] = new Date();

    Promise.all([
      catInfo,
      stdInfo,
      empInfo,
      tmeSrch,
      extnInfo,
      ownerInfo,
      deliv,
      prefLang,
      feedbackLog,
      finInfo,
      compSrc,
      clientWait,
      clientVisit,
      instr,
      genMain,
      extraMain,
      idGen,
      notific,
      genioByPass
    ])
      .then(result => {
        end_time[5] = new Date();
        taken_time[5] =
          (end_time[5].getTime() - start_time[5].getTime()) / 1000;
        debug_resp["5"] = {};
        debug_resp["5"]["action"] = "Promise ALL Resolved Time";
        debug_resp["5"]["time"] = moment().format("H:mm:ss");
        debug_resp["5"]["takentime"] = taken_time[5];

        let catRes = result[0];
        if (catRes.length > 0) {
          let paidCatArr = [],
            nonpaidCatArr = [],
            paidCatStr = "",
            nonpaidCatStr = "",
            fos = 0;
          let catid, category_name, display_product_flag;
          for (var i = 0; i < catRes.length; i++) {
            //let catid = parseInt(catInfo[i].catid);

            catid = _.trim(catRes[i].catid);
            category_name = _.trim(catRes[i].category_name);
            display_product_flag = parseInt(catRes[i].display_product_flag);

            if (_.includes(temp_catlin_arr, catid) === true) {
              paidCatArr.push(category_name);
            } else {
              nonpaidCatArr.push(category_name);
            }
          }
          if (paidCatArr.length > 0) {
            paidCatStr = paidCatArr.join("|~|");
          }
          if (nonpaidCatArr.length > 0) {
            nonpaidCatStr = nonpaidCatArr.join("|~|");
          }
          tempdata["catinfo"] = {};
          tempdata["catinfo"]["paid"] = paidCatStr;
          tempdata["catinfo"]["nonpaid"] = nonpaidCatStr;
          tempdata["catinfo"]["fos"] = fos;
        }
        let stdRes = result[1];
        let stdcode = "";
        if (stdRes.length > 0) {
          stdcode = stdRes[0]["stdcode"];

          if (stdcode.substr(0, 1) == "0") {
            stdcode = stdcode.substr(1);
          }
        }
        tempdata["stdcode"] = stdcode;

        let empRes = result[2];
        let empData = {};
        if (empRes.length > 0) {
          empData = empRes[0];
        }
        tempdata["mktgEmpMaster"] = empData;

        let tmeSrchRes = result[3];
        let tmeSrchData = {};
        if (tmeSrchRes.length > 0) {
          tmeSrchData = tmeSrchRes[0];
        }
        tempdata["tbl_tmesearch"] = tmeSrchData;

        let extnRes = result[4];
        let extnData = {};
        tempdata["Extension"] = "";
        if (extnRes.length > 0) {
          extnData["error"] = {};
          extnData["data"] = {};
          extnData["error"]["code"] = 1;
          extnData["error"]["msg"] = "Extension Data Not Found";
          extnRes = JSON.parse(extnRes);
          let extn_found = 0;
          if (parseInt(extnRes["numRows"]) > 0) {
            let exn_phn_res = {};
            for (var i = 1; i <= 10; i++) {
              if (!isEmpty(extnRes["result"]["phone_" + i])) {
                extn_found = 1;

                exn_phn_res["phone_" + i] = extnRes["result"]["phone_" + i];
                exn_phn_res["extn_" + i] = extnRes["result"]["extn_" + i];
              }
            }
            if (extn_found == 1) {
              extnData["error"]["code"] = 0;
              extnData["error"]["msg"] = "Extension Data Found";
              extnData["data"]["numRows"] = 1;
              extnData["data"]["result"] = exn_phn_res;
              tempdata["Extension"] = extnData;
            }
          }
        }

        let ownerRes = result[5];
        let ownerData = {};
        ownerData["errorCode"] = 2;
        ownerData["errorStatus"] = "No Data";

        tempdata["ownershipData"] = ownerData;

        let delivRes = result[6];
        let delivData = 0;
        if (delivRes.length > 0) {
          delivData = 1;
        }
        tempdata["deliveredCases"] = delivData;

        let prefLangRes = result[7];
        let prefLangData = {};
        if (prefLangRes.length > 0) {
          prefLangData = prefLangRes;
        }
        tempdata["PreferedLanguage"] = prefLangData;

        let deactReason = result[8];
        let deactRsnData = {};
        if (deactReason.length > 0) {
          deactRsnData = deactReason[0];
        }
        tempdata["deactive_reason"] = deactRsnData;

        let finRes = result[9];
        let finData = {};
        let finpaidtatus = 0;
        let paidexpired = 0;
        if (finRes.length > 0) {
          paidexpired = 1;
          for (var i = 0; i < finRes.length; i++) {
            let campaignid = finRes[i].campaignid;
            finData[campaignid] = {};
            finData[campaignid]["campaignid"] = finRes[i].campaignid;
            finData[campaignid]["budget"] = finRes[i].budget;
            finData[campaignid]["balance"] = finRes[i].balance;
            finData[campaignid]["bid_perday"] = finRes[i].bid_perday;
            finData[campaignid]["expired"] = finRes[i].expired;
            finData[campaignid]["expired_on"] = finRes[i].expired_on;
            finData[campaignid]["duration"] = finRes[i].duration;
            paidexpired = Math.min(paidexpired, finRes[i].expired);
            if (finRes[i].balance > 0) {
              finpaidtatus = 1;
            }
          }
        }

        tempdata["tbl_companymaster_finance"] = finData;

        tempdata["paidExpiredStatus"] = paidexpired;
        tempdata["finpaidtatus"] = finpaidtatus;

        let compSrcRes = result[10];
        let compSrcData = {};
        if (compSrcRes.length > 0) {
          compSrcData = compSrcRes[0];
        }
        tempdata["company_source"] = compSrcData;

        let clientWaitRes = result[11];
        let clientWaitFlag = 0;
        if (clientWaitRes.length > 0) {
          clientWaitFlag = 1;
        }
        tempdata["client_waiting_flag"] = clientWaitFlag;

        let clientVisitRes = result[12];
        let clientVisitData = {};
        clientVisitData["errorCode"] = 1;
        if (clientVisitRes.length > 0) {
          clientVisitData = clientVisitRes[0];

          if (
            clientVisitData["start_time"] == "" ||
            clientVisitData["start_time"] == null
          ) {
            clientVisitData["disable"] = 0;
          } else {
            clientVisitData["disable"] = 1;
          }
          clientVisitData["errorCode"] = 0;
        }
        tempdata["client_visiting_data"] = clientVisitData;

        let instrRes = result[13];
        let instrData = "No Instructions for this contract";
        if (instrRes.length > 0) {
          if (!isEmpty(instrRes[0]["instruction"])) {
            instrData = instrRes[0]["instruction"];
          }
        }
        tempdata["instruction"] = instrData;

        let genMainRes = result[14];
        let genMainData = {};
        if (genMainRes.length > 0) {
          genMainData = genMainRes[0];
          if (team_type === "rd") {
            tempdata["tbl_companymaster_generalinfo_shadow"] = genMainData;
          }
        }
        tempdata["tbl_companymaster_generalinfo"] = genMainData;

        let extraMainRes = result[15];
        let extraMainData = {};
        if (extraMainRes.length > 0) {
          extraMainData = extraMainRes[0];
        }
        tempdata["tbl_companymaster_extradetails"] = extraMainData;

        let idGenRes = result[16];
        let idGenData = {};
        if (idGenRes.length > 0) {
          idGenData = idGenRes[0];
        }
        tempdata["tbl_id_generator"] = idGenData;

        tempdata["paymenttype"] = [
          "Cash",
          "Master Card",
          "Visa Card",
          "Debit Cards",
          "Cheques",
          "American Express Card",
          "Credit Card"
        ];
        let notificRes = result[17];
        let notification_status = "NO";
        if (notificRes.length > 0) {
          notificRes = JSON.parse(notificRes);
          if (notificRes["errorCode"] == 0) {
            for (var prop in notificRes["results"]) {
              if (notificRes["results"].hasOwnProperty(prop)) {
                if (
                  notificRes["results"][prop]["isLiteUser"] ||
                  notificRes["results"][prop]["app_version"]
                ) {
                  notification_status = "YES";
                  break;
                }
              }
            }
          }
        }
        tempdata["notification_status"] = notification_status;

        let genioByPassRes = result[18];
        if (Object.keys(genioByPassRes).length > 0) {
          tempdata["bypassgeniolite"] = 1;
        } else {
          tempdata["bypassgeniolite"] = 0;
        }

        let curtime = new Date();
        let total_time = (curtime.getTime() - start_time[1].getTime()) / 1000;
        debug_resp["Process End Time"] = moment().format("H:mm:ss");
        debug_resp["Total Time Taken"] = total_time;

        if (total_time >= logsec) {
          textlog("tempdetails", parentid, debug_resp);
        }

        return res
          .status(200)
          .json({error: {code: 0}, data: tempdata, debug: debug_resp});
      })
      .catch(err => {
        return res.status(500).json({error: {code: 1, msg: err.stack}});
      });
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.dndInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const data_city = req.body.data_city;
  let url_info = URLINFO(data_city);

  let conn_city_obj = new ConnCity();

  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_iro = conf["iro"][conn_city];
    const conn_fin = conf["finance"][conn_city];

    let contact_details_arr = {};
    let stdcode, DND_stdcode;
    if (!isEmpty(req.body.landline)) {
      let landline = req.body.landline;
      let landline_arr = [];

      landline_arr = landline.split(",");
      landline_arr = _.uniq(_.compact(landline_arr));

      if (landline_arr.length > 0) {
        if (isEmpty(req.body.stdcode)) {
          return res
            .status(400)
            .json({error: {code: 1, msg: "stdcode is blank"}});
        }
        stdcode = req.body.stdcode;
        DND_stdcode = _.trimStart(stdcode, "0");

        let l = 0;

        landline_arr.forEach(function(val_landline) {
          if (l === 0) {
            contact_details_arr["phone"] = val_landline;
          } else {
            contact_details_arr["phone" + (l + 1)] = val_landline;
          }
          l++;
        });
      }
    }
    if (!isEmpty(req.body.mobile)) {
      let mobile = req.body.mobile;
      let mobile_arr = [];

      mobile_arr = mobile.split(",");
      mobile_arr = _.uniq(_.compact(mobile_arr));
      if (mobile_arr.length > 0) {
        let m = 0;

        mobile_arr.forEach(function(val_mobile) {
          if (m === 0) {
            contact_details_arr["mobile"] = val_mobile;
          } else {
            contact_details_arr["mobile" + (m + 1)] = val_mobile;
          }
          m++;
        });
      }
    }
    let red_list = [];
    let green_list = [];

    let number_array = [
      "phone",
      "phone2",
      "phone3",
      "phone4",
      "mobile",
      "mobile2",
      "mobile3",
      "mobile4"
    ];

    let contact_details = "",
      contact_details_tele = "",
      contact_details_mobile = "";
    if (Object.keys(contact_details_arr).length > 0) {
      number_array.forEach(function(value) {
        if (!isEmpty(contact_details_arr[value])) {
          if (value.indexOf("phone") != -1) {
            contact_details_tele += stdcode + contact_details_arr[value] + " ";
          }
          if (value.indexOf("mobile") != -1) {
            contact_details_mobile += contact_details_arr[value] + " ";
          }
        }
      });
      contact_details = _.trim(
        contact_details_tele + contact_details_mobile,
        " "
      );
      contact_details = contact_details.replace(/\s+/, " ");

      let final_contact_arr = [];
      final_contact_arr = contact_details.split(" ");
      final_contact_arr = _.uniq(_.compact(final_contact_arr));
      if (final_contact_arr.length > 0) {
        let dnc_data = {};
        dnc_data["data"] = {};
        dnc_data["data"]["phonenum"] = final_contact_arr.join(",");

        let dnc_url = url_info["jdbox_url"] + "services/dncsearch.php";
        let dncInfo = await curlObj.curlCall(
          "xxx",
          dnc_url,
          dnc_data,
          "post",
          {}
        );

        let dnd_numbers_arr = [];
        let nondnd_numbers_arr = [];
        if (Object.keys(dncInfo).length > 0) {
          dncInfo = JSON.parse(dncInfo);

          for (var contactval in dncInfo) {
            if (dncInfo.hasOwnProperty(contactval)) {
              if (dncInfo[contactval]["found"] == 1) {
                if (dncInfo[contactval]["status"] == "DND") {
                  dnd_numbers_arr.push(contactval);
                } else if (dncInfo[contactval]["status"] == "NonDND") {
                  nondnd_numbers_arr.push(contactval);
                }
              }
            }
          }
        }
        for (let numberVal of final_contact_arr) {
          let final_number;
          if (_.includes(numberVal, dnd_numbers_arr)) {
            if (parseInt(DND_stdcode) > 0) {
              let len_std = DND_stdcode.length;
              let std_number = numberVal.substr(0, len_std);
              if (parseInt(std_number) == parseInt(DND_stdcode)) {
                final_number = numberVal.substr(len_std);
              } else {
                final_number = numberVal;
              }
            } else {
              final_number = numberVal;
            }

            const matchedContract = await dbcon.db_query({
              conn: conn_iro,
              query:
                "SELECT group_concat(DISTINCT parentid SEPARATOR '\", \"') as parentids FROM tbl_companymaster_search WHERE MATCH(phone_search) AGAINST('" +
                final_number +
                "')"
            });
            if (Object.keys(matchedContract).length > 0) {
              if (!isEmpty(matchedContract[0].parentids)) {
                let pidlist = _.trim(matchedContract[0].parentids);

                const paidConInfo = await dbcon.db_query({
                  conn: conn_fin,
                  query:
                    'SELECT parentid FROM tbl_companymaster_finance WHERE parentid IN ("' +
                    pidlist +
                    '") AND balance > 0 LIMIT 1'
                });
                if (Object.keys(paidConInfo).length > 0) {
                  green_list.push(final_number);
                } else {
                  red_list.push(final_number);
                }
              }
            }
          } else if (_.includes(numberVal, nondnd_numbers_arr)) {
            if (parseInt(DND_stdcode) > 0) {
              let len_std = DND_stdcode.length;
              let std_number = numberVal.substr(0, len_std);
              if (parseInt(std_number) == parseInt(DND_stdcode)) {
                final_number = numberVal.substr(len_std);
              } else {
                final_number = numberVal;
              }
            } else {
              final_number = numberVal;
            }
            green_list.push(final_number);
          }
        }
      }
    }
    var retval = {red_list: red_list, green_list: green_list};
    return res.status(200).json(retval);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getStateInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  let conn_city_obj = new ConnCity();

  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];
    const stateInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT DISTINCT st_name, state_id FROM state_master WHERE country_id = '98' ORDER by st_name"
    });
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["data"] = {};
    if (Object.keys(stateInfo).length > 0) {
      resp_obj["data"] = stateInfo;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "State Data Found";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "State Data Not Found";
      return res.status(200).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getCityInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const data_city = req.body.data_city;

  let conn_city_obj = new ConnCity();

  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];
    let state_id = 0;
    if (!isEmpty(req.body.state_id)) {
      state_id = req.body.state_id;
    } else {
      const stateId = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT state_id FROM city_master WHERE ct_name = '" + data_city + "'"
      });
      if (Object.keys(stateId).length > 0) {
        state_id = stateId[0]["state_id"];
      }
    }
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["data"] = {};
    if (parseInt(state_id) > 0) {
      state_id = parseInt(state_id);

      const cityInfo = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT ct_name, city_id,state_name FROM city_master WHERE state_id ='" +
          state_id +
          "' AND DE_display=1 AND display_flag=1 AND ct_name!='' ORDER BY ct_name"
      });
      if (Object.keys(cityInfo).length > 0) {
        resp_obj["data"] = cityInfo;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "City Data Found";
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "City Data Not Found";
        return res.status(200).json(resp_obj);
      }
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "state_id Not Found";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.cityAutoSuggest = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const data_city = req.body.data_city;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    if (!isEmpty(req.body.term)) {
      let term = req.body.term;
      let cond = "";
      if (!isEmpty(req.body.remote)) {
        let remote = req.body.remote;

        if (remote == 1) {
          cond = " city_id not in ('8','11','29','34','19','25','5','1') AND ";
        }
      }
      let resp_obj = {};
      resp_obj["error"] = {};
      resp_obj["data"] = {};
      const cityList = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT ct_name,stdcode FROM city_master WHERE " +
          cond +
          " ct_name LIKE '" +
          term +
          "%' AND country_id ='98' AND allow_data = '1' AND DE_display=1 AND display_flag=1  LIMIT 10"
      });
      let cityListObj = {};
      if (Object.keys(cityList).length > 0) {
        let cityRows = Object.keys(cityList).length;
        for (var i = 0; i < cityRows; i++) {
          let ct_name = _.trim(cityList[i].ct_name);
          ct_name = _.startCase(_.toLower(ct_name));
          let stdcode = _.trim(cityList[i].stdcode);
          cityListObj[ct_name] = {};
          cityListObj[ct_name]["std"] = stdcode;
        }
      }
      if (Object.keys(cityListObj).length > 0) {
        resp_obj["data"] = cityListObj;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "City Data Found";
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "City Data Not Found";
        return res.status(200).json(resp_obj);
      }
    } else {
      return res.status(400).json({error: {code: 1, msg: "term is blank"}});
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});
exports.getStreetInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.search)) {
    return res.status(400).json({error: {code: 1, msg: "search is blank."}});
  }
  if (isEmpty(req.body.city)) {
    return res.status(400).json({error: {code: 1, msg: "city is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }
  const data_city = req.body.data_city;

  let url_info = URLINFO(data_city);

  let street_url = url_info["jdbox_url"] + "services/location_api.php";
  let streetdata = {};
  streetdata["data"] = {};
  streetdata["data"]["rquest"] = "get_area";
  streetdata["data"]["type"] = "3";
  streetdata["data"]["search"] = req.body.search;
  streetdata["data"]["city"] = req.body.city;

  if (!isEmpty(req.body.area)) {
    streetdata["data"]["parent_area"] = req.body.area;
  }
  if (!isEmpty(req.body.pincode)) {
    streetdata["data"]["pincode"] = req.body.pincode;
  }
  streetdata["data"]["limit"] = "10";
  streetdata["data"]["module"] = "TME";

  let streetInfo = await curlObj.curlCall(
    "xxx",
    street_url,
    streetdata,
    "post",
    {}
  );
  let resp_obj = {};
  resp_obj["error"] = {};
  resp_obj["error"]["code"] = 1;
  resp_obj["error"]["msg"] = "Street Data Not Found";
  if (Object.keys(streetInfo).length > 0) {
    streetInfo = JSON.parse(streetInfo);
    if (streetInfo["numRows"] > 0) {
      resp_obj["data"] = streetInfo["result"]["street"];
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Street Data Found";
      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    resp_obj["error"]["msg"] = "Not getting response from location_api";
    return res.status(500).json(resp_obj);
  }
});

exports.getAreaInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.search)) {
    return res.status(400).json({error: {code: 1, msg: "search is blank."}});
  }
  if (isEmpty(req.body.city)) {
    return res.status(400).json({error: {code: 1, msg: "city is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  const data_city = req.body.data_city;

  let url_info = URLINFO(data_city);

  let area_url = url_info["jdbox_url"] + "services/location_api.php";
  let areadata = {};
  areadata["data"] = {};
  areadata["data"]["rquest"] = "get_area";
  areadata["data"]["type"] = "1";
  areadata["data"]["search"] = req.body.search;
  areadata["data"]["city"] = req.body.city;
  if (!isEmpty(req.body.live_area)) {
    areadata["data"]["live_area"] = req.body.live_area;
  }
  if (!isEmpty(req.body.autosuggest)) {
    areadata["data"]["autosuggest"] = req.body.autosuggest;
  }

  areadata["data"]["limit"] = "10";
  areadata["data"]["module"] = "TME";

  let areaInfo = await curlObj.curlCall("xxx", area_url, areadata, "post", {});
  let resp_obj = {};
  resp_obj["error"] = {};
  resp_obj["error"]["code"] = 1;
  resp_obj["error"]["msg"] = "Area Data Not Found";
  if (Object.keys(areaInfo).length > 0) {
    areaInfo = JSON.parse(areaInfo);
    if (areaInfo["numRows"] > 0) {
      var obj = {};
      for (
        var i = 0, len = areaInfo["result"]["areaname"].length;
        i < len;
        i++
      ) {
        if (!obj[areaInfo["result"]["areaname"][i]["areaname"]])
          obj[areaInfo["result"]["areaname"][i]["areaname"]] =
            areaInfo["result"]["areaname"][i];
      }
      var newArr = [];
      for (var key in obj) newArr.push(obj[key]);
      resp_obj["data"] = newArr;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Area Data Found";

      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    resp_obj["error"]["msg"] = "Not getting response from location_api";
    return res.status(500).json(resp_obj);
  }
});

exports.areaAutoSuggest = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const data_city = req.body.data_city;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    if (!isEmpty(req.body.term)) {
      let term = req.body.term;

      let resp_obj = {};
      resp_obj["error"] = {};
      resp_obj["data"] = {};
      const areaList = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT DISTINCT areaname,stdcode FROM tbl_areamaster_consolidated_v3 WHERE data_city = '" +
          data_city +
          "' AND display_flag = 1 AND type_flag=1 AND areaname LIKE '" +
          term +
          "%' ORDER BY areaname LIMIT 10"
      });
      let areaListObj = {};
      if (Object.keys(areaList).length > 0) {
        let areaRows = Object.keys(areaList).length;
        for (var i = 0; i < areaRows; i++) {
          let areaname = _.trim(areaList[i].areaname);
          areaname = _.startCase(_.toLower(areaname));
          let stdcode = _.trim(areaList[i].stdcode);
          areaListObj[areaname] = {};
          areaListObj[areaname]["std"] = stdcode;
        }
      }
      if (Object.keys(areaListObj).length > 0) {
        resp_obj["data"] = areaListObj;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Area Data Found";
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "Area Data Not Found";
        return res.status(200).json(resp_obj);
      }
    } else {
      return res.status(400).json({error: {code: 1, msg: "term is blank"}});
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getLandmarkInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  if (isEmpty(req.body.search)) {
    return res.status(400).json({error: {code: 1, msg: "search is blank."}});
  }
  if (isEmpty(req.body.city)) {
    return res.status(400).json({error: {code: 1, msg: "city is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }
  const data_city = req.body.data_city;
  let url_info = URLINFO(data_city);

  let landmark_url = url_info["jdbox_url"] + "services/location_api.php";
  let landmarkdata = {};
  landmarkdata["data"] = {};
  landmarkdata["data"]["rquest"] = "get_area";
  landmarkdata["data"]["type"] = "2";
  landmarkdata["data"]["search"] = req.body.search;
  landmarkdata["data"]["city"] = req.body.city;

  if (!isEmpty(req.body.area)) {
    landmarkdata["data"]["parent_area"] = req.body.area;
  }

  if (!isEmpty(req.body.pincode)) {
    landmarkdata["data"]["pincode"] = req.body.pincode;
  }
  landmarkdata["data"]["limit"] = "10";
  landmarkdata["data"]["module"] = "TME";

  let landmarkInfo = await curlObj.curlCall(
    "xxx",
    landmark_url,
    landmarkdata,
    "post",
    {}
  );
  let resp_obj = {};
  resp_obj["error"] = {};
  resp_obj["error"]["code"] = 1;
  resp_obj["error"]["msg"] = "Landmark Data Not Found";

  if (Object.keys(landmarkInfo).length > 0) {
    landmarkInfo = JSON.parse(landmarkInfo);
    if (landmarkInfo["numRows"] > 0) {
      resp_obj["data"] = landmarkInfo["result"]["landmark"];
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Landmark Data Found";
      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    resp_obj["error"]["msg"] = "Not getting response from location_api";
    return res.status(500).json(resp_obj);
  }
});

exports.getStdCodeInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  if (isEmpty(req.body.pincode)) {
    return res.status(400).json({error: {code: 1, msg: "pincode is blank."}});
  }

  const data_city = req.body.data_city;
  const pincode = req.body.pincode;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    let stdcond = "";
    if (parseInt(pincode) > 0) {
      stdcond = " AND pincode	=	'" + pincode + "'";
    } else {
      stdcond = " AND data_city	=	'" + data_city + "'";
    }
    const stdInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT stdcode FROM tbl_areamaster_consolidated_v3 WHERE display_flag = 1 " +
        stdcond +
        " LIMIT 1"
    });
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Stdcode Not Found";
    if (Object.keys(stdInfo).length > 0) {
      let stdcode = stdInfo[0]["stdcode"];

      if (stdcode.substr(0, 1) == "0") {
        stdcode = stdcode.substr(1);
      }
      resp_obj["stdcode"] = stdcode;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Stdcode Found";
      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getPincodeInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  const data_city = req.body.data_city;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    let term = req.body.term;
    let condition = "";
    let limit_cond = "";
    if (!isEmpty(req.body.city)) {
      let city = req.body.city;

      condition +=
        " (data_city = '" +
        addSlashes(city) +
        "' OR city = '" +
        addSlashes(city) +
        "') AND ";
    }

    if (!isEmpty(req.body.area)) {
      let area = req.body.area;
      condition += " areaname like '%" + area + "%' AND ";
    }
    if (!isEmpty(req.body.pincode)) {
      let pincode = req.body.pincode;
      condition += " pincode LIKE '" + addSlashes(pincode) + "%' AND ";
      limit_cond = " LIMIT 10 ";
    }

    let groupby = "";
    if (!isEmpty(req.body.auto) && req.body.auto == 1) {
      groupby = " GROUP BY pincode ";
    }
    if (condition == "") {
      condition += " data_city = '" + addSlashes(data_city) + "' AND ";
    }

    const pinInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT DISTINCT pincode,stdcode,latitude_final,longitude_final FROM  tbl_areamaster_consolidated_v3 WHERE " +
        condition +
        " display_flag = 1 AND type_flag = 1 AND pincode IS NOT NULL " +
        groupby +
        " ORDER BY pincode " +
        limit_cond +
        " "
    });
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Pincode Data Not Found";
    let pincodeInfoObj = {};
    if (Object.keys(pinInfo).length > 0) {
      let pinLen = Object.keys(pinInfo).length;
      let pincodeval, latitude_final, longitude_final, stdcode;
      for (var i = 0; i < pinLen; i++) {
        pincodeval = _.trim(pinInfo[i].pincode);
        latitude_final = _.trim(pinInfo[i].latitude_final);
        longitude_final = _.trim(pinInfo[i].longitude_final);
        stdcode = _.trim(pinInfo[i].stdcode);

        if (stdcode.substr(0, 1) == "0") {
          stdcode = stdcode.substr(1);
        }
        pincodeInfoObj[pincodeval] = {};
        pincodeInfoObj[pincodeval]["std"] = stdcode;
        pincodeInfoObj[pincodeval]["lat"] = latitude_final;
        pincodeInfoObj[pincodeval]["lon"] = longitude_final;
      }
      resp_obj["data"] = pincodeInfoObj;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Pincode Data Found";
      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getPincodeLookup = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  if (isEmpty(req.body.pincode)) {
    return res.status(400).json({error: {code: 1, msg: "pincode is blank."}});
  }

  const data_city = req.body.data_city;
  const pincode = req.body.pincode;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const pinLookup = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT DISTINCT pincode,areaname as area,city,state,data_city FROM tbl_areamaster_consolidated_v3  WHERE pincode='" +
        pincode +
        "' and type_flag=1 AND display_flag=1 AND pincode IS NOT NULL"
    });
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Pincode Not Found";
    let pincodeInfoArr = [];
    if (Object.keys(pinLookup).length > 0) {
      for (var i = 0; i < Object.keys(pinLookup).length; i++) {
        pincodeInfoArr.push(pinLookup[i]);
      }
      resp_obj["data"] = pincodeInfoArr;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Pincode Found";
      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.correctIncorrectInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;

  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const p1 = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT parentid FROM tbl_correct_incorrect WHERE parentid='" +
        parentid +
        "' ORDER by entry_date DESC LIMIT 1"
    });

    const p2 = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT edited_data FROM tbl_companydetails_edit WHERE parentid='" +
        parentid +
        "' ORDER BY entry_date DESC LIMIT 1"
    });

    Promise.all([p1, p2])
      .then(result => {
        let return_data = {};
        return_data["results"] = {};
        return_data["results"]["data"] = 0;

        let crrIncrrRes = result[0];
        if (Object.keys(crrIncrrRes).length > 0) {
          return_data["results"]["data"] = 1;
        }

        let editedData = result[1];
        if (Object.keys(editedData).length > 0) {
          return_data["results"]["edited_data"] = editedData[0].edited_data;
        } else {
          return_data["results"]["edited_data"] = {};
        }
        // return res.status(200).json(return_data);
        return res.status(200).json({error: {code: 0}, data: return_data});
      })
      .catch(err => {
        return res.status(500).json({error: {code: 1, msg: err.stack}});
      });
  }
});

exports.getNarrationInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  const data_city = req.body.data_city;
  const parentid = req.body.parentid;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const narrInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT narration FROM tbl_paid_narration WHERE contractid = '" +
        parentid +
        "' ORDER BY creationDt DESC"
    });
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Narration Data Not Found";
    let narrationData = [];
    if (Object.keys(narrInfo).length > 0) {
      for (var i = 0; i < Object.keys(narrInfo).length; i++) {
        narrationData.push(narrInfo[i]);
      }
      resp_obj["data"] = narrationData;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Narration Data Found";
      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getMandateinfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  const data_city = req.body.data_city;
  const parentid = req.body.parentid;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_fin = conf["finance"][conn_city];

    const mandInfo = await dbcon.db_query({
      conn: conn_fin,
      query:
        "SELECT parentid, billAmount, billing_cycle FROM db_ecs_billing.ecs_bill_details WHERE parentid='" +
        parentid +
        "' ORDER BY duedate DESC LIMIT 1"
    });
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Mandate Info Not Found";
    let mandateData = [];
    if (Object.keys(mandInfo).length > 0) {
      for (var i = 0; i < Object.keys(mandInfo).length; i++) {
        mandateData.push(mandInfo[i]);
      }
      resp_obj["data"] = mandateData;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Mandate Info Found";
      return res.status(200).json(resp_obj);
    }
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.checkLeadContract = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  const data_city = req.body.data_city;
  const parentid = req.body.parentid;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const retentionInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT parentid FROM tbl_new_retention WHERE parentid='" +
        parentid +
        "' LIMIT 1"
    });
    let found = 0;
    if (Object.keys(retentionInfo).length > 0) {
      found = 1;
      return res.status(200).json(found);
    } else {
      const leadInfo = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT parentid FROM tbl_new_lead WHERE parentid='" +
          parentid +
          "' LIMIT 1"
      });
      if (Object.keys(leadInfo).length > 0) {
        found = 1;
        return res.status(200).json(found);
      }
      return res.status(200).json(found);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.updateClientInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank."}});
  }
  if (isEmpty(req.body.disp_flag)) {
    return res.status(400).json({error: {code: 1, msg: "disp_flag is blank."}});
  }
  const data_city = req.body.data_city;
  const parentid = req.body.parentid;
  const ucode = req.body.ucode;
  const disp_flag = req.body.disp_flag;
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);

  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];
    let resp_obj = {};
    resp_obj["error"] = {};
    resp_obj["error"]["code"] = 0;
    resp_obj["error"]["msg"] = "no error";
    if (disp_flag == 2) {
      let disp_value = "";
      if (!isEmpty(req.body.disp_value)) {
        disp_value = req.body.disp_value;
      }
      const updateClient = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_walkin_client_details SET final_status = '" +
          disp_value +
          "',end_time = NOW() WHERE parentid = '" +
          parentid +
          "' AND tmecode = '" +
          ucode +
          "' AND (final_status = '' OR final_status IS NULL)"
      });
      return res.status(200).json(resp_obj);
    } else {
      const updateClient = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_walkin_client_details SET start_time = NOW() WHERE parentid = '" +
          parentid +
          "' AND tmecode = '" +
          ucode +
          "' AND (final_status = '' OR final_status IS NULL)"
      });
      return res.status(200).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.imageDetails = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.docid)) {
    return res.status(400).json({error: {code: 1, msg: "docid is blank."}});
  }
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const data_city = req.body.data_city;
  const docid = req.body.docid;

  let url_info = URLINFO(data_city);
  let vlcInfo = {};
  let vlc_url =
    url_info["web_services"] +
    "vlc.php?docid=" +
    docid +
    "&city=" +
    data_city +
    "&mode=tme&media=c&data=l&group=1";

  vlcInfo = await curlObj.curlCall("xxx", vlc_url, {}, "get", {});

  let resp_obj = {};
  resp_obj["error"] = {};

  if (!isEmpty(vlcInfo)) {
    vlcInfo = JSON.parse(vlcInfo);
    if (Object.keys(vlcInfo).length > 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Found";
      resp_obj["data"] = vlcInfo;
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Found";
    }
    return res.status(200).json(resp_obj);
  } else {
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Not getting response from vlc API";
    return res.status(500).json(resp_obj);
  }
});

exports.sourceWiseDuplicacyChk = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  if (typeof req.body.paid === "undefined") {
    return res
      .status(400)
      .json({error: {code: 1, msg: "paid param is missing."}});
  }

  if (isEmpty(req.body.data_source)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "data_source is blank."}});
  }

  if (isEmpty(req.body.contact_details)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "contact_details is blank."}});
  }

  if (isEmpty(req.body.datasource_date)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "datasource_date is blank."}});
  }

  if (isEmpty(req.body.updatedOn)) {
    return res.status(400).json({error: {code: 1, msg: "updatedOn is blank."}});
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const paid = req.body.paid;
  const data_source = req.body.data_source.toLowerCase();
  const contact_details = req.body.contact_details;
  const updatedOn = req.body.updatedOn;
  const datasource_date = req.body.datasource_date;

  const datasource_arr = [
    "joinfree",
    "adprogrograms",
    "iro deferred sa",
    "iro deferred ap",
    "transferred",
    "iro transferred"
  ];
  let url_info = URLINFO(data_city);

  let resp_obj = {};
  resp_obj["error"] = {};
  resp_obj["error"]["code"] = 1;
  resp_obj["error"]["msg"] = "Duplicate Data Not Found";
  if (
    paid == 0 &&
    _.includes(datasource_arr, data_source) &&
    updatedOn == datasource_date
  ) {
    let random = Math.floor(100 + Math.random() * 900); // three digit random number

    let phnSrchData = {};

    let sphinx_url =
      url_info["iro_url"] +
      "mvc/autosuggest/Adv_search?dcity=" +
      data_city +
      "&scity=" +
      data_city +
      "&phone=" +
      contact_details +
      "&mod=TME&limit=100&debug=0&paid=3&act=3&t=" +
      random;
    phnSrchData = await curlObj.curlCall("xxx", sphinx_url, {}, "get", {});
    if (!isEmpty(phnSrchData)) {
      phnSrchData = JSON.parse(phnSrchData);

      if (
        !isEmpty(phnSrchData["results"]) &&
        !isEmpty(phnSrchData["results"]["data"])
      ) {
        let pid_arr = [];
        let resdata = {};
        let condata = phnSrchData["results"]["data"];
        for (let prop in condata) {
          let conval = condata[prop];
          let matchedpid = conval["parentid"];
          resdata[matchedpid] = {};
          if (parentid != matchedpid) {
            pid_arr.push(matchedpid);
            resdata[matchedpid]["companyname"] = conval["compname"];
            resdata[matchedpid]["frcSrc"] = 2;
            resdata[matchedpid]["flgAfterCallStatus"] = 1;
            resdata[matchedpid]["paid"] = conval["paidstatus"];
            resdata[matchedpid]["nonpaid"] = 1 - parseInt(conval["paidstatus"]);
          }
        }
        let pidInfo = {};
        if (pid_arr.length > 0) {
          //Fetching Connection City
          let conn_city_obj = new ConnCity();
          const conninfo = await conn_city_obj.getConnCity(req.body);
          if (conninfo.err === 0) {
            const conn_city = conninfo.conn_city;
            const conn_iro = conf["iro"][conn_city];
            let pid_str = pid_arr.join("','");
            pidInfo = await dbcon.db_query({
              conn: conn_iro,
              query:
                "SELECT parentid,address,contact_person FROM tbl_companymaster_search WHERE parentid IN ('" +
                pid_str +
                "')"
            });

            if (Object.keys(pidInfo).length > 0) {
              for (var i = 0; i < Object.keys(pidInfo).length; i++) {
                let pidnew = pidInfo[i].parentid;
                let address = pidInfo[i].address;
                let contact_person = pidInfo[i].contact_person;
                if (!isEmpty(resdata[pidnew])) {
                  resdata[pidnew]["address"] = address;
                  resdata[pidnew]["contact_person"] = contact_person;
                } else {
                  resdata[pidnew]["address"] = "";
                  resdata[pidnew]["contact_person"] = "";
                }
              }
            }
          } else {
            return res
              .status(500)
              .json({error: {code: 1, msg: "Not able to identify conn_city"}});
          }
        }
        resp_obj["data"] = resdata;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Duplicate Data Found";
        return res.status(200).json(resp_obj);
      }
    }
  }
  return res.status(200).json(resp_obj);
});

exports.paymentNarrationInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;

  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];
    const conn_fin = conf["finance"][conn_city];

    const narrInfo = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT narration FROM tbl_paid_narration WHERE contractid = '" +
        parentid +
        "' ORDER BY creationDt DESC"
    });

    const finInfo = dbcon.db_query({
      conn: conn_fin,
      query:
        "SELECT campaignid,budget,balance FROM tbl_companymaster_finance WHERE parentid = '" +
        parentid +
        "' AND campaignid IN (1,2,5,13)"
    });

    const compSrc = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT DISTINCT a.mainsource,b.sName,a.subsource,a.datesource from tbl_company_source a LEFT JOIN source b on a.mainsource=b.sCode WHERE a.contactID ='" +
        parentid +
        "' ORDER BY a.datesource"
    });

    const instInfo = dbcon.db_query({
      conn: conn_fin,
      query:
        "SELECT a.instrumentId, a.parentid, a.instrumentType, a.instrumentAmount, a.tdsAmount, a.version, a.entry_date, a.paymentType ,b.accountsRecievedFlag, b.bankSentFlag, b.bankClearanceFlag, b.accountsClearanceFlag, b.finalApprovalFlag,c.chequeNo, c.chequeDate,  c.bankBranch, c.bankName, c.location, c.depositDate,e.approvalCode,f.companyname FROM payment_instrument_summary a JOIN payment_clearance_details b on a.instrumentid=b.instrumentid LEFT JOIN payment_cheque_details c on a.instrumentid=c.instrumentid LEFT JOIN payment_cash_details d on a.instrumentid=d.instrumentid LEFT JOIN payment_cc_details e on a.instrumentid=e.instrumentid JOIN payment_otherdetails f on a.parentid=f.parentid and a.version=f.version WHERE a.parentid='" +
        parentid +
        "' ORDER BY a.entry_date DESC"
    });

    Promise.all([narrInfo, finInfo, compSrc, instInfo])
      .then(result => {
        let return_data = {};
        let narrationRes = result[0];
        let narrationData = [];
        if (Object.keys(narrationRes).length > 0) {
          for (let i = 0; i < Object.keys(narrationRes).length; i++) {
            narrationData.push(narrationRes[i]["narration"]);
          }
          return_data["narration"] = narrationData;
        } else {
          return_data["narration"] = [];
        }
        let finDataRes = result[1];
        let camname_obj = {};
        camname_obj["1"] = "Phone Search - Package";
        camname_obj["2"] = "Phone Search - Platinum/Diamond";
        camname_obj["5"] = "Competitors Banner";
        camname_obj["13"] = "Category Banner";
        let balobj = {};
        if (Object.keys(finDataRes).length > 0) {
          for (let i = 0; i < Object.keys(finDataRes).length; i++) {
            let campaignid = finDataRes[i].campaignid;
            let balance = finDataRes[i].balance;
            let budget = finDataRes[i].budget;
            let tempobj = {};
            tempobj["campaingid"] = campaignid;
            tempobj["campaingnname"] = camname_obj[campaignid];
            tempobj["balance"] = balance;
            tempobj["budget"] = budget;

            balobj[campaignid] = tempobj;
          }
          return_data["balanceinfo"] = balobj;
        } else {
          return_data["balanceinfo"] = [];
        }
        let compSrcRes = result[2];

        let compSrcData = [];
        if (Object.keys(compSrcRes).length > 0) {
          for (let i = 0; i < Object.keys(compSrcRes).length; i++) {
            compSrcData.push(compSrcRes[i]);
          }
          return_data["comsourcedata"] = compSrcData;
        } else {
          return_data["comsourcedata"] = [];
        }
        let intrumentRes = result[3];
        let intrumentData = {};
        if (Object.keys(intrumentRes).length > 0) {
          for (let i = 0; i < Object.keys(intrumentRes).length; i++) {
            let instrumentId = intrumentRes[i].instrumentId;
            intrumentData[instrumentId] = intrumentRes[i];
          }
          return_data["instrumentinfo"] = intrumentData;
        } else {
          return_data["instrumentinfo"] = [];
        }
        return res.status(200).json(return_data);
      })
      .catch(err => {
        return res.status(500).json({error: {code: 1, msg: err.stack}});
      });
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.sendAppLink = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank"}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  if (isEmpty(req.body.companyname)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "companyname is blank"}});
  }
  if (isEmpty(req.body.empNum)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "Employee Number (empNum) is missing."}});
  }
  if (isEmpty(req.body.mobile)) {
    return res.status(400).json({error: {code: 1, msg: "mobile is blank"}});
  }
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const companyname = req.body.companyname;
  const empNum = req.body.empNum;
  const mobile = req.body.mobile;

  let url_info = URLINFO(data_city);

  let resp_obj = {};
  resp_obj["error"] = {};

  let referInfo = {};
  let referral_url =
    "http://win.justdial.com/26june2015/shareReferrals.php?mobile=" +
    empNum +
    "&source=2";

  referInfo = await curlObj.curlCall("xxx", referral_url, {}, "get", {});
  if (isEmpty(referInfo) || referInfo["error"]) {
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "SMS has not been sent..";
    return res.status(500).json(resp_obj);
  }

  let hindiArr = [
    "mumbai",
    "delhi",
    "pune",
    "ahmedabad",
    "jaipur",
    "chandigarh"
  ];
  let englishArr = [
    "bangalore",
    "chennai",
    "hyderabad",
    "kolkata",
    "coimbatore"
  ];

  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];
    const conn_fin = conf["finance"][conn_city];

    const zoneInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT main_zone FROM tbl_zone_cities WHERE Cities = '" +
        data_city +
        "'"
    });

    let inboxDemo = "https://youtu.be/b0b49xPKSIo";
    if (Object.keys(zoneInfo).length > 0) {
      let zoneRes = zoneInfo[0];
      let main_zone = zoneRes["main_zone"].toLowerCase();
      if (_.includes(englishArr, main_zone)) {
        inboxDemo = "https://youtu.be/BKYfSZjMts8";
      }
    }

    const paidInfo = await dbcon.db_query({
      conn: conn_fin,
      query:
        "SELECT parentid FROM tbl_companymaster_finance WHERE parentid = '" +
        parentid +
        "' AND balance > 0"
    });
    let paidstatus = 0;
    if (Object.keys(paidInfo).length > 0) {
      paidstatus = 1;
    }
    let sms_text = "";
    if (paidstatus == 1) {
      sms_text += companyname + ",\n\n";
      sms_text += "IMPORTANT NOTICE\n";
      sms_text +=
        "Receive & Manage your Business Enquiries on Justdial App. It's fast with instant notifications & great analytical tools!\n";
      sms_text += "Click and Download NOW.\n";
      sms_text += "https://jsdl.in/appqdl\n";
      sms_text +=
        "Click to Watch this 2 min video to understand how to download & check Feedback\n";
      sms_text += inboxDemo + "\n";
    } else {
      sms_text += "Download all new, Super-fast JD App\n\n";
      sms_text += "https://jsdl.in/appqdl\n";
      sms_text += "What's new?\n";
      sms_text += "- News, trending stories & Live TV on JD Social\n";
      sms_text += "- Chat messenger to connect with businesses\n";
    }

    let mobile_arr = [];
    mobile_arr = mobile.split(",");
    mobile_arr = _.uniq(_.compact(mobile_arr));

    let dnc_data = {};
    dnc_data["data"] = {};
    dnc_data["data"]["phonenum"] = mobile_arr.join(",");

    let dnc_url = url_info["jdbox_url"] + "services/dncsearch.php";
    let dncInfo = await curlObj.curlCall("xxx", dnc_url, dnc_data, "post", {});

    let dnd_numbers_arr = [];
    let nondnd_numbers_arr = [];
    if (Object.keys(dncInfo).length > 0) {
      dncInfo = JSON.parse(dncInfo);

      for (let contactval in dncInfo) {
        if (dncInfo.hasOwnProperty(contactval)) {
          if (
            dncInfo[contactval]["found"] == 1 &&
            dncInfo[contactval]["status"] == "DND"
          ) {
            dnd_numbers_arr.push(contactval);
          }
        }
      }

      if (dnd_numbers_arr.length > 0) {
        let dnd_numbers_str = dnd_numbers_arr.join(",");
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] =
          "SMS has not been sent to client as we found number " +
          dnd_numbers_str +
          " in DND";
        return res.status(200).json(resp_obj);
      }
      let value_str = "";
      mobile_arr.forEach(function(mobilenum) {
        value_str +=
          "('CB_INTIMATION','" +
          mobilenum +
          "','" +
          addSlashes(sms_text) +
          "','Y'),";
      });
      if (!isEmpty(value_str)) {
        value_str = value_str.replace(/,\s*$/, ""); // removing last comma

        const sendLink = await dbcon.db_query({
          conn: conn_fin,
          query:
            "INSERT ignore INTO db_jd_emailsms.tmeappentry(TMEName,EmpMobile,SmsText,SmsReady) VALUES " +
            value_str
        });
        if (Object.keys(sendLink).length > 0) {
          resp_obj["error"]["code"] = 0;
          resp_obj["error"]["msg"] = "SMS has been sent to the client.";
          return res.status(200).json(resp_obj);
        }
      }
    }
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "SMS has not been sent.";
    return res.status(500).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.sendTvAdLink = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  if (isEmpty(req.body.mobile)) {
    return res.status(400).json({error: {code: 1, msg: "mobile is blank"}});
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const ucode = req.body.ucode;
  const uname = req.body.uname;
  const mobile = req.body.mobile;
  let url_info = URLINFO(data_city);

  let linkInfo = {};

  let tvadlink_url = url_info["jdbox_url"] + "services/newTvcs_service.php";
  let postdata = {};
  postdata["data"] = {};
  postdata["data"]["parentid"] = parentid;
  postdata["data"]["data_city"] = data_city;
  postdata["data"]["module"] = module;
  postdata["data"]["ucode"] = ucode;
  postdata["data"]["uname"] = uname;
  postdata["data"]["mobile"] = mobile;
  if (!isEmpty(req.body.ad_id)) {
    postdata["data"]["ad_id"] = ad_id;
  }

  linkInfo = await curlObj.curlCall("xxx", tvadlink_url, postdata, "post", {});
  let resp_obj = {};
  resp_obj["error"] = {};
  if (Object.keys(linkInfo).length > 0) {
    linkInfo = JSON.parse(linkInfo);
    if (linkInfo["error"]["code"] == 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = linkInfo["error"]["msg"];
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = linkInfo["error"]["msg"];
      return res.status(200).json(resp_obj);
    }
  } else {
    resp_obj["error"]["msg"] = "Not getting API Response";
    return res.status(500).json(resp_obj);
  }
});

exports.sendTvAdNAppLink = async function(req, res) {
  let resp_obj = {};
  resp_obj["error"] = {};
  resp_obj["error"]["code"] = 1;
  resp_obj["error"]["msg"] =
    "Please call sendapplink & sendtvadlink bform routes.";
  return res.status(500).json(resp_obj);
};

exports.iroAppTransfer = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  if (isEmpty(req.body.module)) {
    return res.status(400).json({error: {code: 1, msg: "module is blank"}});
  }

  if (isEmpty(req.body.extn)) {
    return res.status(400).json({error: {code: 1, msg: "extn is blank"}});
  }
  if (req.body.extn.length < 4) {
    return res.status(400).json({error: {code: 1, msg: "Invalid Extension"}});
  }

  const data_city = req.body.data_city;
  const module = req.body.module;
  const extn = req.body.extn;
  let url_info = URLINFO(data_city);
  let curtime_min20 = moment()
    .subtract(20, "minute")
    .format("YYYY-MM-DD H:mm:ss");

  let last10_extn = extn.slice(-10);

  let cond = "";
  if (extn.length == 4) {
    cond = "(ExtNo =" + extn + " OR Clinum =" + extn + " )";
  } else if (extn.length > 4) {
    cond =
      "(CallerMobile =" +
      last10_extn +
      "  OR CallerPhone =" +
      extn +
      " OR Clinum =" +
      extn +
      ")";
  }

  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_iro = conf["iro"][conn_city];
    const conn_fin = conf["finance"][conn_city];

    const transferInfo = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT Clinum,IroCode,IroName,CallerName,CallerMobile,CallerPhone,ExtNo,Parentid,Category,City,EntryDate,Uniquefield,type,f12_id FROM tbl_apptransfer WHERE  " +
        cond +
        " AND EntryDate >= '" +
        curtime_min20 +
        "' AND tmetransferflag = 0 ORDER BY EntryDate DESC LIMIT 1"
    });

    let resp_obj = {};
    resp_obj["error"] = {};
    let tansferObj = {};
    if (Object.keys(transferInfo).length > 0) {
      let transeferData = transferInfo[0];
      tansferObj[0] = transeferData;
      let parentid = transeferData["Parentid"];

      const paidInfo = await dbcon.db_query({
        conn: conn_fin,
        query:
          "SELECT count(parentid) FROM db_finance.tbl_companymaster_finance WHERE parentid ='" +
          parentid +
          "' AND balance>0 AND expired=0 AND freeze = 0 AND mask =0 GROUP BY parentid"
      });
      if (Object.keys(paidInfo).length > 0) {
        tansferObj["paid"] = 1;
      } else {
        tansferObj["paid"] = 0;
      }
      tansferObj["saveas_nonpaid"] = 0;

      let mongo_data = {};
      mongo_data["data"] = {};
      mongo_data["data"]["parentid"] = parentid;
      mongo_data["data"]["data_city"] = data_city;
      mongo_data["data"]["module"] = module;
      mongo_data["data"]["table"] = "tbl_companymaster_generalinfo_shadow";
      let mongo_url = url_info["mongo_url"] + "api/shadowinfo/getdata";
      let genInfo = await curlObj.curlCall(
        "xxx",
        mongo_url,
        mongo_data,
        "post",
        {}
      );
      if (!isEmpty(genInfo)) {
        genInfo = JSON.parse(genInfo);
        let getlivedata = 1;
        if (genInfo["error"] == 0) {
          let genData = genInfo["data"];
          if (!isEmpty(genData["pincode"]) && !isEmpty(genData["area"])) {
            getlivedata = 0;
            tansferObj["pincode"] = genData["pincode"];
            tansferObj["area"] = genData["area"];
            tansferObj["source"] = "noupdate";
          }
        }
        if (getlivedata == 1) {
          const liveData = await dbcon.db_query({
            conn: conn_iro,
            query:
              "SELECT area,pincode FROM tbl_companymaster_generalinfo WHERE parentid='" +
              parentid +
              "'"
          });
          if (Object.keys(liveData).length > 0) {
            let liveResult = liveData[0];
            tansferObj["pincode"] = liveResult["pincode"];
            tansferObj["area"] = liveResult["area"];
            tansferObj["source"] = "noshadow";
          } else {
            tansferObj["pincode"] = "";
            tansferObj["area"] = "";
            tansferObj["source"] = "noshadowmain";
          }
        }
        const insertAppData = await dbcon.db_query({
          conn: conn_iro,
          query:
            "INSERT INTO db_iro.tbl_appointment_iro SET parentid='" +
            parentid +
            "',ironame='" +
            transeferData["IroName"] +
            "',irocode='" +
            transeferData["IroCode"] +
            "' ON DUPLICATE KEY UPDATE ironame='" +
            transeferData["IroName"] +
            "', irocode='" +
            transeferData["IroCode"] +
            "'"
        });
        if (Object.keys(insertAppData).length > 0) {
          resp_obj["error"]["code"] = 0;
          resp_obj["error"]["msg"] = "Data Inserted";
          resp_obj["data"] = tansferObj;
          return res.status(200).json(resp_obj);
        } else {
          resp_obj["error"]["code"] = 1;
          resp_obj["error"]["msg"] = "Data Not Inserted";
          return res.status(500).json(resp_obj);
        }
      }
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "No Data Found In tbl_apptransfer Table";
      return res.status(200).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.iroAppSaveNExit = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank"}});
  }

  let irodata = {};
  if (isEmpty(req.body.irodata)) {
    return res.status(400).json({error: {code: 1, msg: "irodata is blank"}});
  } else {
    irodata = req.body.irodata;
    if (!isJSON(irodata)) {
      return res
        .status(400)
        .json({error: {code: 1, msg: "Please pass valid json in irodata"}});
    }
    irodata = JSON.parse(irodata);
  }

  const data_city = req.body.data_city;
  const ucode = req.body.ucode;

  const iroparid = irodata["parentid"];
  const irocity = irodata["city"];
  const iropaid = irodata["paid"];

  if (iroparid == undefined) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "iro app parentid is blank"}});
  }

  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const rowIdInfo = await dbcon.db_query({
      conn: conn_local,
      query: "SELECT rowid FROM mktgEmpMap WHERE mktEmpCode ='" + ucode + "'"
    });
    let tmecode = "";
    if (Object.keys(rowIdInfo).length > 0) {
      let rowIdRes = rowIdInfo[0];
      tmecode = rowIdRes["rowid"];
    }
    let resp_obj = {};
    resp_obj["error"] = {};
    const insertSaveNExit = await dbcon.db_query({
      conn: conn_local,
      query:
        "INSERT INTO tbl_saveexit SET parentid	=	'" +
        iroparid +
        "', tmecode		=	'" +
        tmecode +
        "', city		=	'" +
        irocity +
        "', EntryDate	=	NOW() ON DUPLICATE KEY UPDATE tmecode		=	'" +
        tmecode +
        "', city		=	'" +
        irocity +
        "', EntryDate	=	NOW()"
    });

    if (iropaid == 0) {
      const tmeSrchData = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT tmeCode,empCode FROM tbl_tmesearch WHERE parentid = '" +
          iroparid +
          "'"
      });
      let exist_tmecode = "";
      let exist_empcode = "";
      if (Object.keys(tmeSrchData).length > 0) {
        let tmeSrchRes = tmeSrchData[0];
        exist_tmecode = tmeSrchRes["tmeCode"];
        exist_empcode = tmeSrchRes["empCode"];
      }

      if (exist_tmecode.length > 2) {
        let final_tmecode = exist_tmecode;
        let final_empcode = exist_empcode;
      } else {
        let final_tmecode = tmecode;
        let final_empcode = ucode;
      }

      const updateTmeSrch = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_tmesearch SET tmecode = '" +
          final_tmecode +
          "', empCode='" +
          final_empcode +
          "', data_source = 'TRANSFERRED', datasource_date=NOW() WHERE parentid ='" +
          iroparid +
          "'"
      });
    }
    if (Object.keys(insertSaveNExit).length > 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.iroAppProceed = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank"}});
  }

  if (isEmpty(req.body.uname)) {
    return res.status(400).json({error: {code: 1, msg: "uname is blank"}});
  }

  let irodata = {};
  if (isEmpty(req.body.irodata)) {
    return res.status(400).json({error: {code: 1, msg: "irodata is blank"}});
  } else {
    irodata = req.body.irodata;
    if (!isJSON(irodata)) {
      return res
        .status(400)
        .json({error: {code: 1, msg: "Please pass valid json in irodata"}});
    }
    irodata = JSON.parse(irodata);
  }

  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const uname = req.body.uname;

  if (isEmpty(irodata["parentid"])) {
    return res.status(400).json({
      error: {code: 1, msg: "parentid node is missing inside irodata node"}
    });
  }

  if (isEmpty(irodata["Uniquefield"])) {
    return res.status(400).json({
      error: {code: 1, msg: "Uniquefield node is missing inside irodata node"}
    });
  }

  let parentid = irodata["parentid"];
  let Uniquefield = irodata["Uniquefield"];
  let city = "",
    area = "",
    pincode = "",
    source = "",
    calldis = "",
    companyname = "",
    remote_addr = "";

  if (!isEmpty(irodata["city"])) {
    city = irodata["city"];
  }

  if (!isEmpty(irodata["area"])) {
    area = irodata["area"];
  }
  if (!isEmpty(irodata["pincode"])) {
    pincode = irodata["pincode"];
  }
  if (!isEmpty(irodata["source"])) {
    source = irodata["source"];
  }

  if (!isEmpty(irodata["calldis"])) {
    calldis = irodata["calldis"];
  }

  if (!isEmpty(irodata["companyname"])) {
    companyname = irodata["companyname"];
  }
  if (!isEmpty(irodata["remote_addr"])) {
    remote_addr = irodata["remote_addr"];
  }
  let url_info = URLINFO(data_city);
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];
    const conn_iro = conf["iro"][conn_city];
    let current_date = moment().format("YYYY-MM-DD HH:mm:ss");
    if (!isEmpty(area) && !isEmpty(pincode) && !isEmpty(companyname)) {
      let shadow_data = {};
      let mongo_data = {};
      mongo_data["data"] = {};
      mongo_data["data"]["parentid"] = parentid;
      mongo_data["data"]["data_city"] = data_city;
      mongo_data["data"]["module"] = "TME";

      let gendata = {
        updatedata: {
          companyname: companyname,
          area: area,
          pincode: pincode,
          data_city: data_city
        }
      };
      let extradata = {
        updatedata: {
          companyname: companyname,
          updatedOn: current_date,
          data_city: data_city
        },
        insertdata: {
          createdby: ucode,
          createdtime: current_date,
          original_creator: ucode,
          original_date: current_date
        }
      };

      mongo_data["data"]["table_data"] = JSON.stringify({
        tbl_companymaster_generalinfo_shadow: gendata,
        tbl_companymaster_extradetails_shadow: extradata
      });
      let mongo_url = url_info["mongo_url"] + "api/shadowinfo/insertdata";
      shadow_data = await curlObj.curlCall(
        "xxx",
        mongo_url,
        mongo_data,
        "post",
        {}
      );
    }

    const rowIdInfo = await dbcon.db_query({
      conn: conn_local,
      query: "SELECT rowid FROM mktgEmpMap WHERE mktEmpCode ='" + ucode + "'"
    });
    let tmecode = "";
    if (Object.keys(rowIdInfo).length > 0) {
      let rowIdRes = rowIdInfo[0];
      tmecode = rowIdRes["rowid"];
    }
    const tmeSrchData = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT tmeCode,empCode FROM tbl_tmesearch WHERE parentid = '" +
        parentid +
        "'"
    });
    let exist_tmecode = "";
    let exist_empcode = "";
    if (Object.keys(tmeSrchData).length > 0) {
      let tmeSrchRes = tmeSrchData[0];
      exist_tmecode = tmeSrchRes["tmeCode"];
      exist_empcode = tmeSrchRes["empCode"];
    }
    let final_tmecode = "",
      final_empcode = "";
    if (exist_tmecode.length > 2) {
      final_tmecode = exist_tmecode;
      final_empcode = exist_empcode;
    } else {
      final_tmecode = tmecode;
      final_empcode = ucode;
    }

    if (final_tmecode) {
      const updateTmeSrch = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_tmesearch SET tmecode = '" +
          final_tmecode +
          "', empCode='" +
          final_empcode +
          "', data_source = 'TRANSFERRED', datasource_date=NOW() WHERE parentid ='" +
          parentid +
          "'"
      });
    }
    let qry_appointment =
      "UPDATE appointment SET AllocatedTo = '" +
      ucode +
      " - ' WHERE Parentid = '" +
      parentid +
      "' AND Uniquefield = '" +
      Uniquefield +
      "'";
    const updateAppointment = await dbcon.db_query({
      conn: conn_iro,
      query: qry_appointment
    });

    let tmetransferflag = 1;
    if (calldis == "1") {
      tmetransferflag = 0;
    }
    let qry_apptransfer =
      "UPDATE tbl_apptransfer SET tmetransferflag = '" +
      tmetransferflag +
      "' WHERE Parentid = '" +
      parentid +
      "' AND Uniquefield = '" +
      Uniquefield +
      "'";
    const updateAppTransfer = await dbcon.db_query({
      conn: conn_iro,
      query: qry_apptransfer
    });

    let log_str =
      current_date +
      "IP===>" +
      remote_addr +
      "ParentId===>" +
      parentid +
      "AllocatedTo===>" +
      ucode +
      "Qry_Appointment===>" +
      qry_appointment +
      "Qry_AppTransfer======>" +
      qry_apptransfer;

    const updateLogTable = await dbcon.db_query({
      conn: conn_iro,
      query:
        "UPDATE irotmeapplogs SET transferflag = 1,inserttime_tme = NOW(),tmecode='" +
        ucode +
        "',tmename = '" +
        uname +
        "',tme_logs = '" +
        addSlashes(log_str) +
        "', allocated_tme = '" +
        ucode +
        "' WHERE Parentid = '" +
        parentid +
        "' AND uniquefield = '" +
        Uniquefield +
        "'"
    });

    let resp_obj = {};
    resp_obj["error"] = {};

    if (Object.keys(updateAppTransfer).length > 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.pincodeChangeLog = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank"}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank"}});
  }

  let prev_pin = "";
  if (!isEmpty(req.body.prev_pin)) {
    prev_pin = req.body.prev_pin;
    prev_pin = prev_pin.substring(
      prev_pin.lastIndexOf("(") + 1,
      prev_pin.lastIndexOf(")")
    );
  }

  let new_pin = "";
  if (!isEmpty(req.body.new_pin)) {
    new_pin = req.body.new_pin;
    new_pin = new_pin.substring(
      new_pin.lastIndexOf("(") + 1,
      new_pin.lastIndexOf(")")
    );
  }

  let prev_area = "";
  if (!isEmpty(req.body.prev_area)) {
    prev_area = req.body.prev_area;
  }

  let new_area = "";
  if (!isEmpty(req.body.new_area)) {
    new_area = req.body.new_area;
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;

  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    let resp_obj = {};
    resp_obj["error"] = {};
    const insertLog = await dbcon.db_query({
      conn: conn_local,
      query:
        "INSERT INTO tbl_pincode_change_logs SET parentid 		= 	'" +
        parentid +
        "', changed_by		=	'" +
        ucode +
        "', date_of_change	=	NOW(), prev_pincode	=	'" +
        prev_pin +
        "', curr_pincode	=	'" +
        new_pin +
        "', prev_area		=	'" +
        prev_area +
        "', curr_area		=	'" +
        new_area +
        "'"
    });

    if (Object.keys(insertLog).length > 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.areaPincodeRequest = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);
  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  if (isEmpty(req.body.area)) {
    return res.status(400).json({error: {code: 1, msg: "area is blank"}});
  }

  if (isEmpty(req.body.pincode)) {
    return res.status(400).json({error: {code: 1, msg: "pincode is blank"}});
  }
  let stdcode = "";
  if (!isEmpty(req.body.stdcode)) {
    stdcode = req.body.stdcode;
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const ucode = req.body.ucode;
  const uname = req.body.uname;
  const area = req.body.area;
  const pincode = req.body.pincode;

  let url_info = URLINFO(data_city);

  let areaSendInfo = {};

  let area_request_url = url_info["jdbox_url"] + "services/location_api.php";
  let areadata = {};
  areadata["data"] = {};
  areadata["data"]["rquest"] = "new_area_pincode_request";
  areadata["data"]["parentid"] = parentid;
  areadata["data"]["area"] = area;
  areadata["data"]["pincode"] = pincode;
  areadata["data"]["city"] = data_city;
  areadata["data"]["data_city"] = data_city;
  areadata["data"]["stdcode"] = stdcode;
  areadata["data"]["type"] = "area";
  areadata["data"]["ucode"] = ucode;
  areadata["data"]["uname"] = uname;
  areadata["data"]["module"] = module;
  areaSendInfo = await curlObj.curlCall(
    "xxx",
    area_request_url,
    areadata,
    "post",
    {}
  );
  let resp_obj = {};
  resp_obj["error"] = {};

  if (!isEmpty(areaSendInfo)) {
    areaSendInfo = JSON.parse(areaSendInfo);

    if (areaSendInfo["error"]["message"] == "success") {
      let conn_city_obj = new ConnCity();
      const conninfo = await conn_city_obj.getConnCity(req.body);
      if (conninfo.err === 0) {
        const conn_city = conninfo.conn_city;
        const conn_local = conf["local"][conn_city];

        const insertLog = await dbcon.db_query({
          conn: conn_local,
          query:
            " INSERT INTO area_pincode_request_log SET area 		= '" +
            addSlashes(area) +
            "', pincode 	= '" +
            pincode +
            "', empcode 	= '" +
            ucode +
            "', insertdate = NOW()"
        });

        if (Object.keys(insertLog).length > 0) {
          resp_obj["error"]["code"] = 0;
          resp_obj["error"]["msg"] = "Data Inserted";
          return res.status(200).json(resp_obj);
        } else {
          resp_obj["error"]["code"] = 1;
          resp_obj["error"]["msg"] = "Data Not Inserted";
          return res.status(500).json(resp_obj);
        }
      } else {
        return res
          .status(500)
          .json({error: {code: 1, msg: "Not able to identify conn_city"}});
      }
    }
  }
  resp_obj["error"]["code"] = 1;
  resp_obj["error"]["msg"] = "Data Not Inserted";
  return res.status(500).json(resp_obj);
});

exports.insertMobileFeedback = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank"}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank"}});
  }

  if (isEmpty(req.body.mobile)) {
    return res.status(400).json({error: {code: 1, msg: "mobile is blank"}});
  }

  if (isEmpty(req.body.reason)) {
    return res.status(400).json({error: {code: 1, msg: "reason is blank"}});
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;

  const ucode = req.body.ucode;

  const mobile = req.body.mobile;
  const reason = req.body.reason;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_tme = conf["tme_jds"][conn_city];

    const insertLog = await dbcon.db_query({
      conn: conn_tme,
      query:
        " INSERT into tbl_sms_feedback_deactive_log(parentid,feedback_flag,reason,user_id,deactive_date,mobilenumber) values('" +
        parentid +
        "','1','" +
        addSlashes(reason) +
        "','" +
        ucode +
        "',NOW(),'" +
        mobile +
        "')"
    });

    if (Object.keys(insertLog).length > 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.addSuggestedCity = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank"}});
  }

  // Assigning Params

  const data_city = req.body.data_city;
  const ucode = req.body.ucode;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const insertLog = await dbcon.db_query({
      conn: conn_local,
      query:
        " INSERT INTO tbl_suggested_city SET city = '" +
        data_city +
        "', empcode = '" +
        ucode +
        "', insertdate = NOW()"
    });

    if (Object.keys(insertLog).length > 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.corrIncorrUpdate = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  // Action Specific Validation
  if (isEmpty(req.body.docid)) {
    return res.status(400).json({error: {code: 1, msg: "docid is blank"}});
  }

  // Assigning Params

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const uname = req.body.uname;
  const module = req.body.module;
  const docid = req.body.docid;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const insertLog = await dbcon.db_query({
      conn: conn_local,
      query:
        " INSERT INTO tbl_correct_incorrect SET parentid	=	'" +
        parentid +
        "', entry_date	=	NOW(), empcode		=	'" +
        ucode +
        "',data_city	=	'" +
        data_city +
        "',flag		=	1,docid		=	'" +
        docid +
        "' ON DUPLICATE KEY UPDATE entry_date	=	NOW(), empcode		=	'" +
        ucode +
        "',flag		=	1,data_city	=	'" +
        data_city +
        "'"
    });
    let url_info = URLINFO(data_city);
    if (Object.keys(insertLog).length > 0) {
      let savenp_resp = {};
      let savenp_url = url_info["jdbox_url"] + "services/savenonpaid_jda.php";
      let savenpdata = {};
      savenpdata["data"] = {};

      savenpdata["data"]["parentid"] = parentid;
      savenpdata["data"]["data_city"] = data_city;
      savenpdata["data"]["module"] = module;
      savenpdata["data"]["usercode"] = ucode;
      savenpdata["data"]["username"] = uname;
      savenpdata["data"]["post_data"] = 1;
      savenpdata["data"]["corrincorr"] = 1;
      savenp_resp = await curlObj.curlCall(
        "xxx",
        savenp_url,
        savenpdata,
        "post",
        {}
      );
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.buildingAutoComplete = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.term)) {
    return res.status(400).json({error: {code: 1, msg: "term is blank"}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  // Assigning Params

  const term = req.body.term.toLowerCase();
  const data_city = req.body.data_city;

  let term_str = "";
  let term_arr = term.split(" ");
  if (term_arr.length > 0) {
    term_str = term_arr.join("','");
  }

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    if (!isEmpty(term_str)) {
      const autoSuggest = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT Abbrevation, Full_Form FROM tbl_auto_suggest where Abbrevation IN ('" +
          term_str +
          "')"
      });
      if (Object.keys(autoSuggest).length > 0) {
        let building_data = [];
        for (let i = 0; i < Object.keys(autoSuggest).length; i++) {
          building_data.push(autoSuggest[i]);
        }
        resp_obj["data"] = building_data;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Found";
        return res.status(200).json(resp_obj);
      }
    }
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Data Not Found";
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.fetchRestaurantInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.docid)) {
    return res.status(400).json({error: {code: 1, msg: "docid is blank."}});
  }
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  const docid = req.body.docid;
  const data_city = req.body.data_city;
  let url_info = URLINFO(data_city);
  let restInfo = {};
  let rest_url = url_info["restaurant_api"] + "restDet/" + docid;

  restInfo = await curlObj.curlCall("xxx", rest_url, {}, "get", {});

  let resp_obj = {};
  resp_obj["error"] = {};

  if (!isEmpty(restInfo)) {
    restInfo = JSON.parse(restInfo);
    return res.status(200).json(restInfo);
  } else {
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Not getting response from Restaurant API";
    return res.status(500).json(resp_obj);
  }
});

exports.jdpayEcsPopup = asyncMiddleware(async function(req, res) {
  //req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  if (isEmpty(req.body.extn)) {
    return res.status(400).json({error: {code: 1, msg: "extn is blank."}});
  }

  const extn = req.body.extn;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const remote_flag = conninfo.remote_flag;
    const conn_iro = conf["iro"][conn_city];
    const conn_local = conf["local"][conn_city];

    let data_found = 0;
    let f12_id = "";
    let jdpayRes = {};

    const jdpayData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT f12_id,compname,parentid,calluid,scity FROM tbl_f12_transfer_data WHERE (ext='" +
        extn +
        "' OR cli='" +
        extn +
        "') AND status=0 ORDER BY DATETIME DESC LIMIT 1"
    });

    if (Object.keys(jdpayData).length > 0) {
      data_found = 1;
      jdpayRes = jdpayData[0];
      f12_id = jdpayRes["f12_id"];
    }
    if (data_found == 1) {
      const optInfo = await dbcon.db_query({
        conn: conn_iro,
        query:
          "SELECT opt_name FROM tbl_f12_option WHERE opt_code = '" +
          f12_id +
          "'"
      });
      if (Object.keys(optInfo).length > 0) {
        let optRes = optInfo[0];
        jdpayRes["opt_name"] = optRes["opt_name"];
      }
      resp_obj["data"] = jdpayRes;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Found";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Found";
      return res.status(200).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.ecsTransDetailsUpdate = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }
  if (isEmpty(req.body.ip)) {
    return res.status(400).json({error: {code: 1, msg: "ip is blank."}});
  }

  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank."}});
  }

  if (isEmpty(req.body.uname)) {
    return res.status(400).json({error: {code: 1, msg: "uname is blank."}});
  }

  if (isEmpty(req.body.identifier)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "identifier is blank."}});
  }

  if (isEmpty(req.body.calluid)) {
    return res.status(400).json({error: {code: 1, msg: "calluid is blank."}});
  }

  if (isEmpty(req.body.extn)) {
    return res.status(400).json({error: {code: 1, msg: "extn is blank."}});
  }

  const data_city = req.body.data_city;
  const ip = req.body.ip;
  const ucode = req.body.ucode;
  const uname = req.body.uname;
  const identifier = req.body.identifier.toUpperCase();
  const calluid = req.body.calluid;
  const extn = req.body.extn;

  let identifier_arr = ["ECS001", "LR0001"];

  if (!_.includes(identifier_arr, identifier)) {
    return res.status(400).json({
      error: {code: 1, msg: "invalid identifier. Expecting ECS001 or LR0001"}
    });
  }

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_iro = conf["iro"][conn_city];
    const conn_local = conf["local"][conn_city];

    const f12Data = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT flag,parentid,dcity,compname FROM tbl_f12_transfer_data WHERE calluid ='" +
        calluid +
        "'"
    });
    let transfer_update = 0;
    let lead_update = 0;
    let retention_update = 0;
    if (Object.keys(f12Data).length > 0) {
      const updateTransfer = await dbcon.db_query({
        conn: conn_iro,
        query:
          "UPDATE tbl_f12_transfer_data SET status = 1, tme_code = '" +
          ucode +
          "', tme_name ='" +
          uname +
          "' WHERE calluid ='" +
          calluid +
          "'"
      });
      if (Object.keys(updateTransfer).length > 0) {
        transfer_update = 1;
      }

      let f12DataRes = f12Data[0];
      let flag = f12DataRes["flag"];
      let parentid = f12DataRes["parentid"];
      let dcity = f12DataRes["dcity"];
      let compname = f12DataRes["compname"];

      const transferLog = await dbcon.db_query({
        conn: conn_local,
        query:
          "INSERT INTO tbl_transfer_api_log SET parentid = '" +
          parentid +
          "', insert_date = NOW(), extn = '" +
          extn +
          "',tmecode   = '" +
          ucode +
          "',flag = 2"
      });

      let source = "";
      if ((flag & 2) == 2) {
        source = "IRO Irated Transfer";
      } else {
        source = "IRO Transferred";
      }
      let current_date = moment().format("YYYY-MM-DD HH:mm:ss");
      if (identifier == "ECS001") {
        let contract_flag = 0;

        const updateRetention = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_retention SET parentid   =	'" +
            parentid +
            "', tmecode					=	'" +
            ucode +
            "', tmename					=	'" +
            uname +
            "', allocated_date      	=   NOW(), insert_date             =   '" +
            ucode +
            "~" +
            current_date +
            "', update_date				=	NOW(), companyname				=	'" +
            addSlashes(compname) +
            "', data_city				= '" +
            dcity +
            "', escalated_details 		= '', reactivate_flag 		= '', stop_request_datetime 	= '', stop_remark 			= '', reactivated_on 			= '', reactivated_by 			= '', ecs_reject_approved 	= '', stop_reason 			= '', approve_datetime 		= '', approved_by 			= '', reallocated_flag		= '0', ecs_stop_flag 			= '0', action_flag 			= '0', state					= '2', transfer_by_iro			= '1', request_source 			= '" +
            source +
            "', contract_flag 			= '" +
            contract_flag +
            "', ip						= '" +
            ip +
            "' ON DUPLICATE KEY UPDATE tmecode					=	'" +
            ucode +
            "', tmename					=	'" +
            uname +
            "', companyname				=	'" +
            compname +
            "', data_city				= '" +
            dcity +
            "',state= 2, update_date	= NOW(), allocated_date      	=   NOW(), escalated_details 		= '', reactivate_flag 		= '', stop_request_datetime 	= '', stop_remark 			= '', reactivated_on 			= '', reactivated_by 			= '', ecs_reject_approved 	= '', stop_reason 			= '', approve_datetime 		= '', approved_by 			= '', ip						= '', reallocated_flag		= '0', ecs_stop_flag 			= '0', action_flag 			= '0', transfer_by_iro			= '1', state					= '2', request_source 			= '" +
            source +
            "', contract_flag 			= '" +
            contract_flag +
            "', ip						= '" +
            ip +
            "'"
        });
        if (Object.keys(updateRetention).length > 0) {
          retention_update = 1;
        }

        const retentionLog = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_retention_log SET parentid = '" +
            parentid +
            "', tmecode = '" +
            ucode +
            "', tmename = '" +
            uname +
            "', insert_date = NOW(),companyname = '" +
            addSlashes(compname) +
            "',data_city = '" +
            dcity +
            "', transfer_by_iro			= '1', request_source = '" +
            source +
            "',contract_flag = '" +
            contract_flag +
            "', state = 2"
        });
      } else if (identifier == "LR0001") {
        let contract_flag = 1;
        const leadUpdate = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_lead SET parentid	=	'" +
            parentid +
            "', tmecode					=	'" +
            ucode +
            "', tmename					=	'" +
            uname +
            "', allocated_date      	=   NOW(), insert_date             =   '" +
            ucode +
            "~" +
            current_date +
            "', update_date				=	NOW(), companyname				=	'" +
            addSlashes(compname) +
            "', data_city				= '" +
            dcity +
            "', state					= '2', action_flag 			= 0, request_source 			= '" +
            source +
            "', transfer_by_iro			= '1', contract_flag 			= '" +
            contract_flag +
            "', ip						= '" +
            ip +
            "' ON DUPLICATE KEY UPDATE tmecode					=	'" +
            ucode +
            "', tmename					=	'" +
            uname +
            "', companyname				=	'" +
            addSlashes(compname) +
            "', data_city				= '" +
            dcity +
            "', state					= 2, state					= '2', update_date				=	NOW(), request_source 			= '" +
            source +
            "', transfer_by_iro			= '1', contract_flag 			= '" +
            contract_flag +
            "', ip						= '" +
            ip +
            "'"
        });
        if (Object.keys(leadUpdate).length > 0) {
          lead_update = 1;
        }
      }
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Success";
      resp_obj["con_upd_ecs"] = transfer_update;
      resp_obj["con_upd_ecs_ret"] = retention_update;
      resp_obj["con_upd_lead_ret"] = lead_update;
      return res.status(200).json(resp_obj);
    } else {
      return res.status(400).json({
        error: {
          code: 1,
          msg:
            "no data found in tbl_f12_transfer_data for given calluid " +
            calluid
        }
      });
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.fetchECSDetails = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }
  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  const data_city = req.body.data_city;
  const parentid = req.body.parentid;

  let url_info = URLINFO(data_city);

  let resp_obj = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_iro = conf["iro"][conn_city];
    const conn_local = conf["local"][conn_city];
    const conn_finance = conf["finance"][conn_city];

    const genData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT parentid,companyname FROM tbl_companymaster_generalinfo WHERE parentid = '" +
        parentid +
        "'"
    });
    if (Object.keys(genData).length > 0) {
      let genRes = genData[0];
      resp_obj["companyname"] = genRes["companyname"];
      resp_obj["parentid"] = genRes["parentid"];
    }

    resp_obj["curr_contract_value"] = "Not Found";
    resp_obj["tmeName"] = "Not Found";
    resp_obj["mecode"] = "Not Found";
    const versionInfo = await dbcon.db_query({
      conn: conn_finance,
      query:
        "SELECT version FROM payment_apportioning WHERE parentid = '" +
        parentid +
        "' AND (budget != balance) ORDER BY entry_date DESC LIMIT 1"
    });
    if (Object.keys(versionInfo).length > 0) {
      let versionRes = versionInfo[0];
      let current_version = versionRes["version"];

      const liveVersion = await dbcon.db_query({
        conn: conn_finance,
        query:
          "SELECT a.parentid,a.version,a.budget,a.entry_date,b.tmeName,b.meName FROM payment_apportioning a JOIN payment_otherdetails  b ON a.parentid=b.parentid WHERE a.parentid = '" +
          parentid +
          "'  AND (a.budget>0 OR a.balance>0)  AND a.version=b.version  AND (a.budget!=a.balance) ORDER BY a.entry_date DESC,a.version,a.campaignid"
      });

      if (Object.keys(liveVersion).length > 0) {
        let total_budget = 0;
        let tmeName = "";
        let meName = "";
        for (let i = 0; i < Object.keys(liveVersion).length; i++) {
          let budget = liveVersion[i].budget;

          let version = liveVersion[i].version;

          if (current_version == version) {
            total_budget += budget;
            if (!isEmpty(liveVersion[i].tmeName) && isEmpty(tmeName)) {
              tmeName = liveVersion[i].tmeName;
            }
            if (!isEmpty(liveVersion[i].meName) && isEmpty(meName)) {
              meName = liveVersion[i].meName;
            }
          }
        }
        if (total_budget > 0) {
          resp_obj["curr_contract_value"] = total_budget;
          resp_obj["tmeName"] = tmeName;
          resp_obj["mecode"] = meName;
        }
      }
    }
    let contype_res = {};
    let contype_url =
      url_info["jdbox_url"] +
      "services/contract_type.php?parentid=" +
      parentid +
      "&data_city=" +
      data_city +
      "&rquest=get_contract_type";

    contype_res = await curlObj.curlCall("xxx", contype_url, {}, "get", {});

    if (Object.keys(contype_res).length > 0) {
      contype_res = JSON.parse(contype_res);
      if (!isEmpty(contype_res["result"])) {
        let contract_type = contype_res["result"]["contract_type"];
        resp_obj["curr_contract_type"] = contract_type;
      }
    } else {
      resp_obj["curr_contract_type"] = "Not Found";
    }
    resp_obj["error"] = {};
    resp_obj["error"]["code"] = 0;
    resp_obj["error"]["msg"] = "Data Found";
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getAllTME = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }
  if (isEmpty(req.body.term)) {
    return res.status(400).json({error: {code: 1, msg: "term is blank."}});
  }

  let value = 0;
  if (!isEmpty(req.body.value)) {
    value = req.body.value;
  }

  const data_city = req.body.data_city;
  const term = req.body.term;

  let emptype = "";
  if (value == 1) {
    emptype = "5";
  } else {
    emptype = "3";
  }

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const tmeInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT empName FROM mktgEmpMaster WHERE empName LIKE '" +
        term +
        "%' AND empType = '" +
        emptype +
        "' LIMIT 10"
    });
    if (Object.keys(tmeInfo).length > 0) {
      let data_arr = [];
      for (let i = 0; i < Object.keys(tmeInfo).length; i++) {
        data_arr.push(tmeInfo[i].empName);
      }
      resp_obj["data"] = data_arr;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Found";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Found";
      return res.status(200).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.ecsSendUpgradeRequest = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  // Defining default value as blank

  let ecs_flag = "",
    name = "",
    curr_value = "",
    new_value = "",
    curr_type = "",
    new_type = "",
    curr_tme = "",
    new_tme = "",
    curr_me = "",
    new_me = "",
    new_payment = "",
    inst_det = "",
    payment_mode = "",
    id = "",
    payment_date = "",
    payment_number = "",
    payment_amount = "";

  if (!isEmpty(req.body.ecs_flag)) {
    ecs_flag = req.body.ecs_flag;
  }
  if (!isEmpty(req.body.name)) {
    name = req.body.name;
  }
  if (!isEmpty(req.body.curr_value)) {
    curr_value = req.body.curr_value;
  }
  if (!isEmpty(req.body.new_value)) {
    new_value = req.body.new_value;
  }
  if (!isEmpty(req.body.curr_type)) {
    curr_type = req.body.curr_type;
  }
  if (!isEmpty(req.body.new_type)) {
    new_type = req.body.new_type;
  }
  if (!isEmpty(req.body.curr_tme)) {
    curr_tme = req.body.curr_tme;
  }
  if (!isEmpty(req.body.new_tme)) {
    new_tme = req.body.new_tme;
  }
  if (!isEmpty(req.body.curr_me)) {
    curr_me = req.body.curr_me;
  }
  if (!isEmpty(req.body.new_me)) {
    new_me = req.body.new_me;
  }
  if (!isEmpty(req.body.new_payment)) {
    new_payment = req.body.new_payment;
  }
  if (!isEmpty(req.body.inst_det)) {
    inst_det = req.body.inst_det;
  }
  if (!isEmpty(req.body.payment_mode)) {
    payment_mode = req.body.payment_mode;
  }
  if (!isEmpty(req.body.id)) {
    id = req.body.id;
  }
  if (!isEmpty(req.body.payment_date)) {
    payment_date = req.body.payment_date;
  }
  if (!isEmpty(req.body.payment_number)) {
    payment_number = req.body.payment_number;
  }

  if (!isEmpty(req.body.payment_amount)) {
    payment_amount = req.body.payment_amount;
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const uname = req.body.uname;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];
    const conn_iro = conf["iro"][conn_city];
    const conn_tme = conf["tme_jds"][conn_city];

    let final_city = "";
    let main_zone_list = [
      "mumbai",
      "delhi",
      "kolkata",
      "bangalore",
      "chennai",
      "pune",
      "hyderabad",
      "ahmedabad",
      "jaipur",
      "coimbatore",
      "chandigarh"
    ];
    let city_value = data_city.toLowerCase();
    if (_.includes(city_value, main_zone_list)) {
      final_city = city_value;
    } else {
      const zoneInfo = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT main_zone FROM tbl_zone_cities WHERE Cities = '" +
          city_value +
          "'"
      });
      if (Object.keys(zoneInfo).length > 0) {
        let zoneRes = zoneInfo[0];
        final_city = zoneRes["main_zone"];
      }
    }

    let mngr_data = [];
    mngr_data[0] = "";
    mngr_data[1] = "";
    mngr_data[2] = "";
    if (!isEmpty(final_city)) {
      const managerInfo = await dbcon.db_query({
        conn: conn_tme,
        query:
          "SELECT mngr_code FROM ecs_req_mngr_list WHERE data_city = '" +
          final_city +
          "'"
      });

      if (Object.keys(managerInfo).length > 0) {
        mngr_data = []; // reassgining to blank
        for (let i = 0; i < Object.keys(managerInfo).length; i++) {
          mngr_data.push(managerInfo[i].mngr_code);
        }
      }
    }

    let gencomp = "",
      gencity = "",
      genpin = "",
      genmob = "",
      genemail = "",
      genperson = "";
    const genData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT companyname,city,pincode,mobile,email,contact_person FROM tbl_companymaster_generalinfo WHERE parentid = '" +
        parentid +
        "'"
    });

    if (Object.keys(genData).length > 0) {
      let genRes = genData[0];

      gencomp = genRes["companyname"];
      gencity = genRes["city"];
      genpin = genRes["pincode"];
      genmob = genRes["mobile"];
      genemail = genRes["email"];
      genperson = genRes["contact_person"];
    }

    const insertData = await dbcon.db_query({
      conn: conn_tme,
      query:
        "INSERT INTO tbl_ecs_dealclose_pending SET parentid 				= '" +
        parentid +
        "',EmpCode 				= '" +
        ucode +
        "',EmpName 				= '" +
        uname +
        "',MngrCode 				= '" +
        mngr_data[0] +
        "',MngrCode1 				= '" +
        mngr_data[1] +
        "',MngrCode2 				= '" +
        mngr_data[2] +
        "',Acc_Reg_Flag 			= '" +
        ecs_flag +
        "',companyname				= '" +
        addSlashes(gencomp) +
        "',city					= '" +
        gencity +
        "',pincode					= '" +
        genpin +
        "',mobile					= '" +
        genmob +
        "',email					= '" +
        addSlashes(genemail) +
        "',Mngr_Flag				= '0',requested_on 			= NOW(),updated_on 				= '',detail_cname 			= '" +
        name +
        "',detail_cid 				= '" +
        id +
        "',current_contract_value 	= '" +
        curr_value +
        "',new_contract_value 		= '" +
        new_value +
        "',current_contract_type 	= '" +
        curr_type +
        "',new_contract_type 		= '" +
        new_type +
        "',collected_new_payment 	= '" +
        new_payment +
        "',instrument_details 		= '" +
        inst_det +
        "',new_contract_payment_mode= '" +
        payment_mode +
        "',detail_current_tme 		= '" +
        curr_tme +
        "',detail_new_tme 			= '" +
        new_tme +
        "',detail_current_me 		= '" +
        curr_me +
        "',detail_new_me 			= '" +
        new_me +
        "',contact_person			= '" +
        addSlashes(genperson) +
        "',payment_date            = '" +
        payment_date +
        "',payment_number			= '" +
        payment_number +
        "',payment_amount 			= '" +
        payment_amount +
        "'ON DUPLICATE KEY UPDATE EmpName 				= '" +
        uname +
        "',MngrCode 				= '" +
        mngr_data[0] +
        "',MngrCode1 				= '" +
        mngr_data[1] +
        "',MngrCode2 				= '" +
        mngr_data[2] +
        "',Acc_Reg_Flag 			= '" +
        ecs_flag +
        "',companyname				= '" +
        addSlashes(gencomp) +
        "',city					= '" +
        gencity +
        "',pincode					= '" +
        genpin +
        "',mobile					= '" +
        genmob +
        "',email					= '" +
        addSlashes(genemail) +
        "',Mngr_Flag				= '0',requested_on 			= NOW(),updated_on 				= '',detail_cname 			= '" +
        name +
        "',detail_cid 				= '" +
        id +
        "',current_contract_value 	= '" +
        curr_value +
        "',new_contract_value 		= '" +
        new_value +
        "',current_contract_type 	= '" +
        curr_type +
        "',new_contract_type 		= '" +
        new_type +
        "',collected_new_payment 	= '" +
        new_payment +
        "',instrument_details 		= '" +
        inst_det +
        "',new_contract_payment_mode= '" +
        payment_mode +
        "',detail_current_tme 		= '" +
        curr_tme +
        "',detail_new_tme 			= '" +
        new_tme +
        "',detail_current_me 		= '" +
        curr_me +
        "',detail_new_me 			= '" +
        new_me +
        "',contact_person			= '" +
        addSlashes(genperson) +
        "',payment_date            = '" +
        payment_date +
        "',payment_number			= '" +
        payment_number +
        "',payment_amount 			= '" +
        payment_amount +
        "'"
    });

    if (Object.keys(insertData).length > 0) {
      resp_obj["data"] = 1;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["data"] = 0;
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.updateRetentionTmeInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  let ecs_flag = 0;
  if (typeof req.body.ecs_flag === "undefined") {
    return res
      .status(400)
      .json({error: {code: 1, msg: "ecs_flag is missing."}});
  } else {
    ecs_flag = req.body.ecs_flag;
  }

  let companyname = "",
    ip = "";
  if (!isEmpty(req.body.companyname)) {
    companyname = req.body.companyname;
  }

  if (!isEmpty(req.body.ip)) {
    ip = req.body.ip;
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const uname = req.body.uname;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    if (ecs_flag == 1) {
      const updateLead = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_new_lead SET  tmename = '" +
          uname +
          "', tmecode = '" +
          ucode +
          "', update_date = NOW(), allocated_date = NOW() WHERE parentid ='" +
          parentid +
          "'"
      });
      if (Object.keys(updateLead).length > 0) {
        const insertLog = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_lead_log SET parentid		= '" +
            parentid +
            "', tmecode			= '" +
            ucode +
            "', tmename = '" +
            uname +
            "' ,insert_date = NOW(), update_date		= NOW(),companyname		= '" +
            addSlashes(companyname) +
            "',data_city		= '" +
            data_city +
            "',ip				= '" +
            ip +
            "'"
        });
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Success";
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "Failed";
        return res.status(500).json(resp_obj);
      }
    } else {
      const updateRetention = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_new_retention SET  tmename = '" +
          uname +
          "',tmecode = '" +
          ucode +
          "',update_date = NOW(),allocated_date = NOW() WHERE parentid ='" +
          parentid +
          "'"
      });
      if (Object.keys(updateRetention).length > 0) {
        const insertLog = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_retention_log SET parentid		= '" +
            parentid +
            "', tmecode			= '" +
            ucode +
            "', tmename = '" +
            uname +
            "' ,insert_date = NOW(), companyname		= '" +
            addSlashes(companyname) +
            "',data_city		= '" +
            data_city +
            "',ip				= '" +
            ip +
            "'"
        });
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Success";
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "Failed";
        return res.status(500).json(resp_obj);
      }
    }

    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Failed";
    return res.status(500).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.updateRepeatCount = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  let ecs_flag = 0;
  if (typeof req.body.ecs_flag === "undefined") {
    return res
      .status(400)
      .json({error: {code: 1, msg: "ecs_flag is missing."}});
  } else {
    ecs_flag = req.body.ecs_flag;
  }

  let companyname = "",
    ip = "";
  if (!isEmpty(req.body.companyname)) {
    companyname = req.body.companyname;
  }

  if (!isEmpty(req.body.ip)) {
    ip = req.body.ip;
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const uname = req.body.uname;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    if (ecs_flag == 1) {
      const updateLead = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_new_lead SET  repeat_call = '4', repeatcall_taggedon=NOW() WHERE parentid ='" +
          parentid +
          "'"
      });
      if (Object.keys(updateLead).length > 0) {
        const insertLog = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_lead_log SET parentid		= '" +
            parentid +
            "', tmecode			= '" +
            ucode +
            "', tmename = '" +
            uname +
            "' ,insert_date = NOW(), update_date		= NOW(),companyname		= '" +
            addSlashes(companyname) +
            "',data_city		= '" +
            data_city +
            "',repeat_call		= '4', ip				= '" +
            ip +
            "'"
        });
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Success";
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "Failed";
        return res.status(500).json(resp_obj);
      }
    } else {
      const updateRetention = await dbcon.db_query({
        conn: conn_local,
        query:
          "UPDATE tbl_new_retention SET  repeat_call = '3', repeatcall_taggedon=NOW() WHERE parentid ='" +
          parentid +
          "'"
      });
      if (Object.keys(updateRetention).length > 0) {
        const insertLog = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_retention_log SET parentid		= '" +
            parentid +
            "', tmecode			= '" +
            ucode +
            "', tmename = '" +
            uname +
            "' ,insert_date = NOW(), companyname		= '" +
            addSlashes(companyname) +
            "',data_city		= '" +
            data_city +
            "',repeat_call		= '3', ip				= '" +
            ip +
            "'"
        });
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Success";
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "Failed";
        return res.status(500).json(resp_obj);
      }
    }

    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Failed";
    return res.status(500).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.mktgBarLoad = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const module = req.body.module;

  let url_info = URLINFO(data_city);
  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_iro = conf["iro"][conn_city];
    const conn_local = conf["local"][conn_city];

    resp_obj["topVerified"] = {};
    const verifiedInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT parentid FROM tbl_verifyTopcompanyData WHERE parentid='" +
        parentid +
        "'"
    });
    if (Object.keys(verifiedInfo).length > 0) {
      resp_obj["topVerified"]["errorCode"] = 0;
      resp_obj["topVerified"]["errorMsg"] = "Data Found";
    } else {
      resp_obj["topVerified"]["errorCode"] = 1;
      resp_obj["topVerified"]["errorMsg"] = "Data Not Found";
    }

    let shadow_data = {};

    let mongo_data = {};
    mongo_data["data"] = {};
    mongo_data["data"]["parentid"] = parentid;
    mongo_data["data"]["data_city"] = data_city;
    mongo_data["data"]["module"] = module;
    mongo_data["data"]["table"] = "tbl_companymaster_generalinfo_shadow";
    mongo_data["data"]["fields"] = "parentid,pincode,companyname";

    let mongo_url = url_info["mongo_url"] + "api/shadowinfo/getdata";
    shadow_data = await curlObj.curlCall(
      "xxx",
      mongo_url,
      mongo_data,
      "post",
      {}
    );

    let pincode = "";
    let companyname = "";
    let tempdata = {};
    if (Object.keys(shadow_data).length > 0) {
      shadow_data = JSON.parse(shadow_data);
      if (shadow_data["error"] == 0) {
        tempdata = shadow_data["data"];
        pincode = tempdata["pincode"];
        companyname = tempdata["companyname"];
      }
    }
    resp_obj["vc_pincode"] = pincode;
    resp_obj["vc_compname"] = companyname;

    let gen_data = [];
    const genInfo = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT parentid,paid FROM tbl_companymaster_generalinfo WHERE parentid='" +
        parentid +
        "'"
    });
    if (Object.keys(genInfo).length > 0) {
      gen_data = genInfo[0];
    }
    resp_obj["tbl_companymaster_generalinfo"] = gen_data;

    let tmesrch_data = [];
    const tmeSrchInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT parentid,data_source FROM tbl_tmesearch WHERE parentid='" +
        parentid +
        "'"
    });
    if (Object.keys(tmeSrchInfo).length > 0) {
      tmesrch_data = tmeSrchInfo[0];
    }
    resp_obj["tbl_tmesearch"] = tmesrch_data;

    const allocIDInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT allocId,secondary_allocid FROM mktgEmpMaster WHERE mktEmpCode = '" +
        ucode +
        "'"
    });
    let mapped_disp_arr = [];
    if (Object.keys(allocIDInfo).length > 0) {
      let allocIDRes = allocIDInfo[0];

      let alloc_ids_arr = [];
      if (!isEmpty(allocIDRes["allocId"])) {
        alloc_ids_arr.push(allocIDRes["allocId"]);
      }
      if (!isEmpty(allocIDRes["secondary_allocid"])) {
        alloc_ids_arr.push(allocIDRes["secondary_allocid"]);
      }
      if (alloc_ids_arr.length > 0) {
        alloc_ids_arr = _.uniq(_.compact(alloc_ids_arr));

        let alloc_ids_str = alloc_ids_arr.join("','");
        const mappedDisp = await dbcon.db_query({
          conn: conn_local,
          query:
            "SELECT disposition_val FROM tbl_disposition_mapping WHERE allocid IN ('" +
            alloc_ids_str +
            "')"
        });
        if (Object.keys(mappedDisp).length > 0) {
          for (let i = 0; i < Object.keys(mappedDisp).length; i++) {
            mapped_disp_arr.push(mappedDisp[i].disposition_val);
          }
        }
      }
    }
    let dispositionInfo = {};
    let disp_data = {};
    if (mapped_disp_arr.length > 0) {
      let mapped_disp_str = mapped_disp_arr.join("','");

      dispositionInfo = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT disposition_name,disposition_value,optgroup FROM tbl_disposition_info WHERE disposition_value IN ('" +
          mapped_disp_str +
          "') AND display_flag='1' ORDER BY optgroup_priority_flag"
      });
    } else {
      dispositionInfo = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT disposition_name,disposition_value,optgroup FROM tbl_disposition_info where display_flag='1' ORDER BY optgroup_priority_flag"
      });
    }
    if (Object.keys(dispositionInfo).length > 0) {
      for (let i = 0; i < Object.keys(dispositionInfo).length; i++) {
        let optgroup = dispositionInfo[i].optgroup;
        let disposition_name = dispositionInfo[i].disposition_name;
        let disposition_value = dispositionInfo[i].disposition_value;
        if (typeof disp_data[optgroup] == "undefined") {
          disp_data[optgroup] = [];
        }
        disp_data[optgroup].push({
          optgroup: optgroup,
          disposition_name: disposition_name,
          disposition_value: disposition_value
        });
      }
      resp_obj["dispositionInfo"] = disp_data;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Success";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Failed";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.idGeneratorData = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_iro = conf["iro"][conn_city];

    const idGenData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT * FROM tbl_id_generator WHERE parentid = '" + parentid + "'"
    });
    let resp_obj = {};
    if (Object.keys(idGenData).length > 0) {
      resp_obj = idGenData[0];
    }
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getTmeSearchData = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const tmeSrchData = await dbcon.db_query({
      conn: conn_local,
      query: "SELECT * FROM tbl_tmesearch WHERE parentid = '" + parentid + "'"
    });
    let resp_obj = {};
    if (Object.keys(tmeSrchData).length > 0) {
      resp_obj = tmeSrchData[0];
    }
    return res.status(200).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.chkRatingCat = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  if (isEmpty(req.body.module)) {
    return res.status(400).json({error: {code: 1, msg: "module is blank."}});
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;

  let url_info = URLINFO(data_city);
  let shadow_data = {};

  let mongo_data = {};
  mongo_data["data"] = {};
  mongo_data["data"]["parentid"] = parentid;
  mongo_data["data"]["data_city"] = data_city;
  mongo_data["data"]["module"] = module;
  mongo_data["data"]["table"] = JSON.stringify({
    tbl_companymaster_extradetails_shadow:
      "catidlineage_nonpaid,tag_line,certificates,no_employee,accreditations",
    tbl_business_temp_data: "catIds"
  });

  let mongo_url = url_info["mongo_url"] + "api/shadowinfo/getshadowdata";
  shadow_data = await curlObj.curlCall(
    "xxx",
    mongo_url,
    mongo_data,
    "post",
    {}
  );

  let temp_catlin_arr = [];
  let temp_catlin_np_arr = [];
  let all_temp_catids_arr = [];

  let resp_obj = {};
  let tempdata = {};
  if (Object.keys(shadow_data).length > 0) {
    shadow_data = JSON.parse(shadow_data);
    if (shadow_data["error"] == 0) {
      tempdata = shadow_data["data"];
      if (
        tempdata["tbl_business_temp_data"]["catIds"] !== "" ||
        tempdata["tbl_companymaster_extradetails_shadow"][
          "catidlineage_nonpaid"
        ] !== ""
      ) {
        temp_catlin_arr = tempdata["tbl_business_temp_data"]["catIds"].split(
          "|P|"
        );
        temp_catlin_arr = validateCategories(temp_catlin_arr);
        temp_catlin_np_arr = _
          .trim(
            tempdata["tbl_companymaster_extradetails_shadow"][
              "catidlineage_nonpaid"
            ],
            "/"
          )
          .split("/,/");
        temp_catlin_np_arr = validateCategories(temp_catlin_np_arr);
      }
      all_temp_catids_arr = _.uniq(
        _.concat(temp_catlin_arr, temp_catlin_np_arr)
      );

      if (all_temp_catids_arr.length > 0) {
        let conn_city_obj = new ConnCity();
        const conninfo = await conn_city_obj.getConnCity(req.body);
        if (conninfo.err === 0) {
          const conn_city = conninfo.conn_city;
          const conn_local = conf["local"][conn_city];

          let catids_str = all_temp_catids_arr.join(",");
          const catInfo = await dbcon.db_query({
            conn: conn_local,
            query:
              "SELECT catid FROM tbl_categorymaster_generalinfo WHERE promt_ratings_flag&16=16 AND category_name NOT LIKE '%(p)' AND catid IN (" +
              catids_str +
              ")"
          });

          if (Object.keys(catInfo).length > 0) {
            resp_obj["errorCode"] = 1;
            resp_obj["errorStatus"] =
              "Contract contains non Rateable Categories";
            return res.status(200).json(resp_obj);
          } else {
            resp_obj["errorCode"] = 0;
            resp_obj["errorStatus"] = "Rating Categories";
            return res.status(200).json(resp_obj);
          }
        } else {
          return res
            .status(500)
            .json({error: {code: 1, msg: "Not able to identify conn_city"}});
        }
      } else {
        resp_obj["errorCode"] = 1;
        resp_obj["errorStatus"] = "No Categories";
        return res.status(200).json(resp_obj);
      }
    }
  }
  resp_obj["errorCode"] = 1;
  resp_obj["errorStatus"] = "No Categories";
  return res.status(500).json(resp_obj);
});

exports.checkEntryEcsLead = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  if (isEmpty(req.body.final_val)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "final_val is missing."}});
  }
  let final_val = req.body.final_val.toLowerCase();
  let final_val_arr = ["lead", "ecs"];

  if (!_.includes(final_val_arr, final_val)) {
    return res.status(400).json({
      error: {code: 1, msg: "invalid final_val. Expecting lead or ecs"}
    });
  }

  let companyname = "",
    ip = "";
  if (!isEmpty(req.body.companyname)) {
    companyname = req.body.companyname;
  }

  if (!isEmpty(req.body.ip)) {
    ip = req.body.ip;
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const uname = req.body.uname;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    if (final_val == "lead") {
      const leadData = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT parentid FROM tbl_new_lead WHERE  parentid = '" +
          parentid +
          "'"
      });
      if (Object.keys(leadData).length > 0) {
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Inserted";
        resp_obj["data"] = 0;
        return res.status(200).json(resp_obj);
      }
      const insertLead = await dbcon.db_query({
        conn: conn_local,
        query:
          "INSERT INTO tbl_new_lead SET  parentid			=	'" +
          parentid +
          "', companyname 		=	'" +
          addSlashes(companyname) +
          "', tmecode				=	'" +
          ucode +
          "', tmename				=	'" +
          uname +
          "',allocated_date      =   NOW(),insert_date         =   NOW(),update_date			=	NOW(),data_city			=	'" +
          data_city +
          "',request_source		=	'Phone Search',state 				=	'2',ip					= '" +
          ip +
          "'"
      });
      if (Object.keys(insertLead).length > 0) {
        const insertLog = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_lead_log SET parentid		= '" +
            parentid +
            "', tmecode			= '" +
            ucode +
            "', tmename = '" +
            uname +
            "' ,insert_date = NOW(), update_date		= NOW(),companyname		= '" +
            addSlashes(companyname) +
            "',data_city		= '" +
            data_city +
            "',ip				= '" +
            ip +
            "', state = '2', request_source = 'Phone Search'"
        });
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Inserted";
        resp_obj["data"] = 1;
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "Data Not Inserted";
        return res.status(500).json(resp_obj);
      }
    } else {
      const retenData = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT parentid FROM tbl_new_retention WHERE  parentid = '" +
          parentid +
          "'"
      });
      if (Object.keys(retenData).length > 0) {
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Inserted";
        resp_obj["data"] = 0;
        return res.status(200).json(resp_obj);
      }
      const insertReten = await dbcon.db_query({
        conn: conn_local,
        query:
          "INSERT INTO tbl_new_retention SET  parentid			=	'" +
          parentid +
          "', companyname 		=	'" +
          addSlashes(companyname) +
          "', tmecode				=	'" +
          ucode +
          "', tmename				=	'" +
          uname +
          "',allocated_date      =   NOW(),insert_date         =   NOW(),update_date			=	NOW(),data_city			=	'" +
          data_city +
          "',request_source		=	'Phone Search',state 				=	'2',ip					= '" +
          ip +
          "'"
      });
      if (Object.keys(insertReten).length > 0) {
        const insertLog = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_retention_log SET parentid		= '" +
            parentid +
            "', tmecode			= '" +
            ucode +
            "', tmename = '" +
            uname +
            "' ,insert_date = NOW(),companyname		= '" +
            addSlashes(companyname) +
            "',data_city		= '" +
            data_city +
            "',ip				= '" +
            ip +
            "', state = '2', request_source = 'Phone Search'"
        });
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Inserted";
        resp_obj["data"] = 1;
        return res.status(200).json(resp_obj);
      } else {
        resp_obj["error"]["code"] = 1;
        resp_obj["error"]["msg"] = "Data Not Inserted";
        return res.status(500).json(resp_obj);
      }
    }
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Failed";
    return res.status(500).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.estimatedSearchInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.docid)) {
    return res.status(400).json({error: {code: 1, msg: "docid is blank."}});
  }

  const docid = req.body.docid;

  let fiveDaysOld = moment()
    .subtract(5, "days")
    .format("YYYY-MM-DD");

  let username = "sales_team";
  let currdate = moment().format("YYYY-MM-DD");
  let secret_key = "FG_XW-BO._AXG";
  let checkSum = md5(username + currdate + secret_key);

  let link =
    "http://searchmis.justdial.com/custom_search?mis_src=iframe&un=" +
    username +
    "&cs=" +
    checkSum +
    "&date_range=" +
    fiveDaysOld +
    "+-+" +
    currdate +
    "&id=" +
    docid +
    "&type=2";

  let resp_obj = {};
  resp_obj["error"] = {};
  resp_obj["error"]["code"] = 0;
  resp_obj["error"]["msg"] = "Data Found";
  resp_obj["data"] = link;
  return res.status(200).json(resp_obj);
});

exports.getMatchedActiveData = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.id)) {
    return res.status(400).json({error: {code: 1, msg: "id is blank."}});
  }

  const data_city = req.body.data_city;
  const id = req.body.id;
  let url_info = URLINFO(data_city);
  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_iro = conf["iro"][conn_city];

    const CLINumInfo = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT clinum FROM tbl_apptransfer WHERE (clinum = '" +
        id +
        "' OR extno = '" +
        id +
        "' )  ORDER BY entrydate DESC LIMIT 1"
    });
    let phone_no = "";
    if (Object.keys(CLINumInfo).length > 0) {
      let CLINumRes = CLINumInfo[0];
      phone_no = CLINumRes["clinum"];
    } else {
      phone_no = id;
    }

    let random = Math.floor(100 + Math.random() * 900); // three digit random number

    let phnSrchData = {};

    let sphinx_url =
      url_info["iro_url"] +
      "mvc/autosuggest/Adv_search?dcity=" +
      data_city +
      "&scity=" +
      data_city +
      "&phone=" +
      phone_no +
      "&mod=TME&limit=100&debug=0&paid=3&act=3&t=" +
      random;
    phnSrchData = await curlObj.curlCall("xxx", sphinx_url, {}, "get", {});
    if (!isEmpty(phnSrchData)) {
      phnSrchData = JSON.parse(phnSrchData);

      if (
        !isEmpty(phnSrchData["results"]) &&
        !isEmpty(phnSrchData["results"]["data"])
      ) {
        let pid_arr = [];
        let resdata = {};
        let condata = phnSrchData["results"]["data"];

        for (let prop in condata) {
          let conval = condata[prop];
          let parentid = conval["parentid"];
          let companyname = conval["compname"];
          let paid = conval["paidstatus"];
          resdata[parentid] = {};

          pid_arr.push(parentid);
          resdata[parentid]["parentid"] = parentid;
          resdata[parentid]["companyname"] = companyname;
          resdata[parentid]["paid"] = paid;
        }
        let pidInfo = {};
        if (pid_arr.length > 0) {
          //Fetching Connection City
          let conn_city_obj = new ConnCity();
          const conninfo = await conn_city_obj.getConnCity(req.body);
          if (conninfo.err === 0) {
            const conn_city = conninfo.conn_city;
            const conn_iro = conf["iro"][conn_city];
            let pid_str = pid_arr.join("','");
            pidInfo = await dbcon.db_query({
              conn: conn_iro,
              query:
                "SELECT parentid,phone_search,contact_person FROM tbl_companymaster_search WHERE parentid IN ('" +
                pid_str +
                "')"
            });

            if (Object.keys(pidInfo).length > 0) {
              for (var i = 0; i < Object.keys(pidInfo).length; i++) {
                let pidnew = pidInfo[i].parentid;
                let phone_search = pidInfo[i].phone_search;
                let contact_person = pidInfo[i].contact_person;
                if (!isEmpty(resdata[pidnew])) {
                  resdata[pidnew]["phone_search"] = phone_search;
                  resdata[pidnew]["contact_person"] = contact_person;
                } else {
                  resdata[pidnew]["phone_search"] = "";
                  resdata[pidnew]["contact_person"] = "";
                }
              }
            }
          } else {
            return res
              .status(500)
              .json({error: {code: 1, msg: "Not able to identify conn_city"}});
          }
        }
        resp_obj["subdata"] = Object.values(resdata);
        resp_obj["error"]["code"] = 0;
        return res.status(200).json(resp_obj);
      }
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Not getting response from sphinx_api.";
      return res.status(500).json(resp_obj);
    }
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "No record found";
    return res.status(500).json(resp_obj);
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.iroCardInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.docid)) {
    return res.status(400).json({error: {code: 1, msg: "docid is blank."}});
  }
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const data_city = req.body.data_city;
  const docid = req.body.docid;
  let url_info = URLINFO(data_city);

  let iroCardData = {};
  let irocard_url =
    url_info["iro_url"] +
    "mvc/services/company/getcards?docid=" +
    docid +
    "&city=" +
    data_city;

  iroCardData = await curlObj.curlCall("xxx", irocard_url, {}, "get", {});

  let resp_obj = {};
  resp_obj["error"] = {};

  if (!isEmpty(iroCardData)) {
    iroCardData = JSON.parse(iroCardData);
    if (!isEmpty(iroCardData["results"])) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Found";
      resp_obj["data"] = iroCardData["results"]["data"];
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Found";
    }
    return res.status(200).json(resp_obj);
  } else {
    resp_obj["error"]["code"] = 1;
    resp_obj["error"]["msg"] = "Not getting response from iro card API";
    return res.status(500).json(resp_obj);
  }
});

exports.webDialerAllocation = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }

  let companyname = "";
  if (!isEmpty(req.body.companyname)) {
    companyname = req.body.companyname;
  }

  let source = "";
  if (!isEmpty(req.body.source)) {
    source = req.body.source;
  }
  let current_date = moment().format("YYYY-MM-DD HH:mm:ss");

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module;
  const ucode = req.body.ucode;
  const uname = req.body.uname;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const retentionUpdate = await dbcon.db_query({
      conn: conn_local,
      query:
        "INSERT INTO tbl_new_retention SET parentid 		= '" +
        parentid +
        "', tmecode 		= '" +
        ucode +
        "',tmename 		= '" +
        uname +
        "',insert_date 	= '" +
        ucode +
        "~" +
        current_date +
        "',update_date 	= NOW(),companyname 	= '" +
        addSlashes(companyname) +
        "',						state 			= '2',data_city 		= '" +
        data_city +
        "',ecs_stop_flag 	= '0',action_flag 	= '0',complain_type 	= '" +
        source +
        "',allocated_date 	= NOW(),request_source 	= '" +
        source +
        "' ON DUPLICATE KEY UPDATE escalated_details 	= '',repeat_call 		= '',reactivate_flag 	='',complain_type 		='" +
        source +
        "',stop_request_datetime ='',stop_remark 		='',reactivated_on 		= '',reactivated_by 		='',ecs_reject_approved ='',stop_reason 		= '',stop_remark 		='',approve_datetime 	='',approved_by 		='',ip					='',ecs_stop_flag 		='0',action_flag 		= '0',state 				= '2',tmecode 			= '" +
        ucode +
        "',companyname 		= '" +
        addSlashes(companyname) +
        "',tmename 			= '" +
        uname +
        "',update_date 		= now(),data_city 			= '" +
        data_city +
        "',allocated_date 		= NOW(),request_source 		='" +
        source +
        "'"
    });
    if (Object.keys(retentionUpdate).length > 0) {
      const retentionLog = await dbcon.db_query({
        conn: conn_local,
        query:
          "INSERT INTO tbl_new_retention_log SET parentid = '" +
          parentid +
          "',tmecode = '" +
          ucode +
          "',tmename = '" +
          uname +
          "',insert_date = now(),complain_type = '" +
          source +
          "',companyname = '" +
          addSlashes(companyname) +
          "',data_city = '" +
          data_city +
          "',request_source = '" +
          source +
          "',state = '2'"
      });
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Allocated Successfully";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Allocation Failed.";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.phoneSearchAllocation = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }
  // generalinfo city
  if (isEmpty(req.body.contract_city)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "contract_city is blank."}});
  }

  if (isEmpty(req.body.employee_city)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "employee_city is blank."}});
  }

  if (typeof req.body.lead === "undefined") {
    return res
      .status(400)
      .json({error: {code: 1, msg: "lead param is missing."}});
  }

  let companyname = "";
  if (!isEmpty(req.body.companyname)) {
    companyname = req.body.companyname;
  }

  let ip = "";
  if (!isEmpty(req.body.ip)) {
    ip = req.body.ip;
  }

  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const ucode = req.body.ucode;
  const uname = req.body.uname;
  const contract_city = req.body.contract_city.toLowerCase();
  const employee_city = req.body.employee_city.toLowerCase();
  const lead = req.body.lead; // 1 - ECS , 0 - Lead

  let main_cities = [
    "mumbai",
    "delhi",
    "kolkata",
    "bangalore",
    "chennai",
    "pune",
    "hyderabad",
    "ahmedabad"
  ];

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    let final_contract_city = "";
    if (_.includes(contract_city, main_cities)) {
      final_contract_city = contract_city;
    } else {
      const contractZoneInfo = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT main_zone FROM tbl_zone_cities WHERE Cities = '" +
          contract_city +
          "'"
      });
      if (Object.keys(contractZoneInfo).length > 0) {
        let contractZoneRes = contractZoneInfo[0];
        final_contract_city = contractZoneRes["main_zone"];
      }
    }

    let final_employee_city = "";
    if (_.includes(employee_city, main_cities)) {
      final_employee_city = employee_city;
    } else {
      const employeeZoneInfo = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT main_zone FROM tbl_zone_cities WHERE Cities = '" +
          employee_city +
          "'"
      });
      if (Object.keys(employeeZoneInfo).length > 0) {
        let employeeZoneRes = employeeZoneInfo[0];
        final_employee_city = employeeZoneRes["main_zone"];
      }
    }

    if (final_contract_city == final_employee_city) {
      if (lead == 1) {
        // Retention Request
        const retentionUpdate = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_retention SET parentid	=	'" +
            parentid +
            "',tmecode				=		'" +
            ucode +
            "',tmename		 		=		'" +
            uname +
            "',allocated_date		=		NOW(),insert_date			=		NOW(),update_date			=		NOW(),state				=		'2',companyname			=		'" +
            addSlashes(companyname) +
            "',data_city			=		'" +
            data_city +
            "',request_source		=		'Phone Search',ip					= 		'" +
            ip +
            "' ON DUPLICATE KEY UPDATE	tmecode				=		'" +
            ucode +
            "',tmename		 		=		'" +
            uname +
            "',allocated_date		=		NOW(),insert_date			=		NOW(),update_date			=		NOW(),state				=		'2',companyname			=		'" +
            addSlashes(companyname) +
            "',data_city			=		'" +
            data_city +
            "',request_source		=		'Phone Search',ip		= 	'" +
            ip +
            "' "
        });
        if (Object.keys(retentionUpdate).length > 0) {
          const retentionLog = await dbcon.db_query({
            conn: conn_local,
            query:
              "INSERT INTO tbl_new_retention_log SET parentid		=	'" +
              parentid +
              "',tmecode				=		'" +
              ucode +
              "',tmename		 		=		'" +
              uname +
              "',companyname			=	    '" +
              addSlashes(companyname) +
              "',insert_date			=		NOW(),state				=		'2',data_city			= 		'" +
              data_city +
              "',request_source		=		'Phone Search',ip					= 		'" +
              ip +
              "' "
          });
          resp_obj["error"]["code"] = 0;
          resp_obj["error"]["msg"] = "Data Updated";
          return res.status(200).json(resp_obj);
        } else {
          resp_obj["error"]["code"] = 1;
          resp_obj["error"]["msg"] = "Data Not Updated";
          return res.status(500).json(resp_obj);
        }
      } else {
        // Lead Request
        const leadUpdate = await dbcon.db_query({
          conn: conn_local,
          query:
            "INSERT INTO tbl_new_lead SET parentid	=	'" +
            parentid +
            "',tmecode				=		'" +
            ucode +
            "',tmename		 		=		'" +
            uname +
            "',allocated_date		=		NOW(),insert_date			=		NOW(),update_date			=		NOW(),state				=		'2',companyname			=		'" +
            addSlashes(companyname) +
            "',data_city			=		'" +
            data_city +
            "',request_source		=		'Phone Search',ip					=       '" +
            ip +
            "' ON DUPLICATE KEY UPDATE tmecode				=		'" +
            ucode +
            "',tmename		 		=		'" +
            uname +
            "',allocated_date		=		NOW(),insert_date			=		NOW(),update_date			=		NOW(),state				=		'2',companyname			=		'" +
            addSlashes(companyname) +
            "',data_city			=		'" +
            data_city +
            "',request_source		=		'Phone Search',ip					=       '" +
            ip +
            "'"
        });
        if (Object.keys(leadUpdate).length > 0) {
          const leadLog = await dbcon.db_query({
            conn: conn_local,
            query:
              "INSERT INTO tbl_new_lead_log SET parentid		=	'" +
              parentid +
              "',tmecode				=		'" +
              ucode +
              "',tmename		 		=		'" +
              uname +
              "',companyname			=		'" +
              addSlashes(companyname) +
              "',state				=		'2',insert_date			=		NOW(),update_date			=		NOW(),data_city			= 		'" +
              data_city +
              "',request_source		=		'Phone Search',ip					= 		'" +
              ip +
              "'"
          });
          resp_obj["error"]["code"] = 0;
          resp_obj["error"]["msg"] = "Data Updated";
          return res.status(200).json(resp_obj);
        } else {
          resp_obj["error"]["code"] = 1;
          resp_obj["error"]["msg"] = "Data Not Updated";
          return res.status(500).json(resp_obj);
        }
      }
    } else {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] =
        "final_contract_city and final_employee_city are not same.";
      return res.status(200).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.insertDeliveredCaseInfo = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank"}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }

  if (isEmpty(req.body.empcode)) {
    return res.status(400).json({error: {code: 1, msg: "empcode is blank"}});
  }

  if (isEmpty(req.body.empname)) {
    return res.status(400).json({error: {code: 1, msg: "empname is blank"}});
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;

  const empcode = req.body.empcode;
  const empname = req.body.empname;

  let companyname = "",
    need_helpto_install = "",
    frame_installed = "",
    jdrr_frame = "";
  if (!isEmpty(req.body.companyname)) {
    companyname = req.body.companyname;
  }
  if (!isEmpty(req.body.need_helpto_install)) {
    need_helpto_install = req.body.need_helpto_install;
  }

  if (!isEmpty(req.body.frame_installed)) {
    frame_installed = req.body.frame_installed;
  }

  if (!isEmpty(req.body.jdrr_frame)) {
    jdrr_frame = req.body.jdrr_frame;
  }

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_tme = conf["tme_jds"][conn_city];

    const insertLog = await dbcon.db_query({
      conn: conn_tme,
      query:
        " INSERT INTO tbl_deliveredcases	SET parentid = '" +
        parentid +
        "',empcode = '" +
        empcode +
        "',empname = '" +
        empname +
        "',companyname = '" +
        addSlashes(companyname) +
        "',need_helpto_install = '" +
        need_helpto_install +
        "',frame_installed = '" +
        frame_installed +
        "',jdrr_frame = '" +
        jdrr_frame +
        "',logtime=NOW()"
    });

    if (Object.keys(insertLog).length > 0) {
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Inserted";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Inserted";
      return res.status(500).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.ecsEscalationDetails = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }
  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.ucode)) {
    return res.status(400).json({error: {code: 1, msg: "ucode is blank."}});
  }

  let tme_comm = 0;
  if (!isEmpty(req.body.tme_comm)) {
    tme_comm = req.body.tme_comm;
  }

  const data_city = req.body.data_city;
  const parentid = req.body.parentid;
  const ucode = req.body.ucode;

  let resp_obj = {};
  resp_obj["error"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    if (tme_comm != 1) {
      resp_obj["counttot"] = 0;
      const retenTotalCnt = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT COUNT(1) AS cnt FROM tbl_new_retention WHERE tmecode ='" +
          ucode +
          "' OR escalated_details LIKE '%" +
          ucode +
          "%'"
      });
      if (Object.keys(retenTotalCnt).length > 0) {
        let retenTotalRes = retenTotalCnt[0];
        resp_obj["counttot"] = retenTotalRes["cnt"];
      }
      resp_obj["count"] = 0;

      const retentionData = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT companyname as compname,parentId as contractid,update_date as entry_date,allocated_date,update_date,data_city,ecs_stop_flag,tmename,action_flag,tmecode,escalated_details,state,reactivate_flag,reactivated_on,reactivated_by,tme_comment as tme_comments,repeat_call,repeatcall_taggedon,ecs_reject_approved,reactivate_reject_comment,insert_date,allocate_by_cs,repeatCount FROM tbl_new_retention WHERE parentid ='" +
          parentid +
          "'"
      });
      let timestring_ecs = "";
      let ecs_arr = [];

      if (Object.keys(retentionData).length > 0) {
        resp_obj["count"] = 1;
        let retentionRes = retentionData[0];
        ecs_arr.push(retentionRes);
        let action_flag = retentionRes["action_flag"];
        if (action_flag == 5 || action_flag == 23) {
          timestring_ecs = retentionRes["update_date"];
        } else {
          timestring_ecs = retentionRes["allocated_date"];
        }
      }

      const leadData = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT *,parentid as contractid FROM tbl_new_lead WHERE parentid ='" +
          parentid +
          "'"
      });
      let timestring_lead = "";
      let lead_arr = [];

      if (Object.keys(leadData).length > 0) {
        let leadRes = leadData[0];
        lead_arr.push(leadRes);
        let action_flag = leadRes["action_flag"];
        if (action_flag == 5 || action_flag == 23) {
          timestring_lead = leadRes["update_date"];
        } else {
          timestring_lead = leadRes["allocated_date"];
        }
      }
      let final_time = "",
        lead_flag;
      if (!isEmpty(timestring_ecs) && !isEmpty(timestring_lead)) {
        let ecs_date = new Date(timestring_ecs).getTime();
        let lead_date = new Date(timestring_lead).getTime();

        if (ecs_date > lead_date) {
          final_time = timestring_ecs;
          lead_flag = 1;
        } else {
          final_time = timestring_lead;
          lead_flag = 0;
        }
      } else if (!isEmpty(timestring_ecs)) {
        final_time = timestring_ecs;
        lead_flag = 1;
      } else if (!isEmpty(timestring_lead)) {
        final_time = timestring_lead;
        lead_flag = 0;
      }
      let EcsUpdate_Flag = 1;
      if (!isEmpty(final_time)) {
        let requiredTime = moment(final_time).add(30, "days");
        let currentTime = moment().format("YYYY-MM-DD H:mm:ss");

        //moment('2010-10-20').isAfter('2010-10-19'); // true
        if (moment(currentTime).isAfter(requiredTime)) {
          EcsUpdate_Flag = 1;
        } else {
          EcsUpdate_Flag = 0;
        }
      } else {
        EcsUpdate_Flag = 1;
      }
      let tmecode = "";
      if (lead_flag === 1 && !isEmpty(ecs_arr[0]["tmecode"])) {
        tmecode = ecs_arr[0]["tmecode"];
      } else if (lead_flag === 0 && !isEmpty(lead_arr[0]["tmecode"])) {
        tmecode = lead_arr[0]["tmecode"];
      }
      if (!isEmpty(tmecode)) {
        const empInfo = await dbcon.db_query({
          conn: conn_local,
          query:
            "SELECT Approval_flag,allocId FROM mktgEmpMaster WHERE mktEmpCode = '" +
            tmecode +
            "' AND block_emp=0 AND empType=5"
        });
        if (Object.keys(empInfo).length > 0) {
          let empRes = empInfo[0];
          resp_obj["isActive"] = empRes["Approval_flag"];
          resp_obj["allocID"] = empRes["allocId"];
        }
      }

      if (lead_flag === 1) {
        ecs_arr[0]["EcsUpdate_Flag"] = EcsUpdate_Flag;
        resp_obj["data"] = ecs_arr;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Found";
        return res.status(200).json(resp_obj);
      } else if (lead_flag === 0) {
        lead_arr[0]["EcsUpdate_Flag"] = EcsUpdate_Flag;
        resp_obj["data"] = lead_arr;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Found";
        return res.status(200).json(resp_obj);
      } else {
        let temparr = [];
        let tempobj = {};
        tempobj["EcsUpdate_Flag"] = 1;

        temparr.push(tempobj);
        resp_obj["data"] = temparr;
        resp_obj["error"]["code"] = 0;
        resp_obj["error"]["msg"] = "Data Found";
        return res.status(200).json(resp_obj);
      }
    }

    /*if (Object.keys(tmeInfo).length > 0) {
      let data_arr = [];
      for (let i = 0; i < Object.keys(tmeInfo).length; i++) {
        data_arr.push(tmeInfo[i].empName);
      }
      resp_obj["data"] = data_arr;
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Found";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Found";
      return res.status(200).json(resp_obj);
    }*/
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.setVersion = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank"}});
  }
  const data_city = req.body.data_city;
  const parentid = req.body.parentid;
  let bypassgeniolite = 0;
  if (!isEmpty(req.body.bypassgeniolite)) {
    bypassgeniolite = req.body.bypassgeniolite;
  }
  let url_info = URLINFO(data_city);

  let resp_obj = {};
  resp_obj["error"] = {};
  if (bypassgeniolite == 1) {
    let tme_version_url =
      url_info["jdbox_url"] +
      "services/versioninit.php?parentid=" +
      parentid +
      "&data_city=" +
      data_city +
      "&module=tme";

    const p1 = curlObj.curlCall("xxx", tme_version_url, {}, "get", {});

    let me_version_url =
      url_info["jdbox_url"] +
      "services/versioninit.php?parentid=" +
      parentid +
      "&data_city=" +
      data_city +
      "&module=me";

    const p2 = curlObj.curlCall("xxx", me_version_url, {}, "get", {});

    Promise.all([p1, p2])
      .then(result => {
        // return res.status(200).json(return_data);
        let tme_version_res = result[0];

        let tme_version_update = 0;
        if (
          Object.keys(tme_version_res).length > 0 &&
          isJSON(tme_version_res)
        ) {
          let tmeVersionInfo = JSON.parse(tme_version_res);
          if (tmeVersionInfo["version"]) {
            tme_version_update = 1;
          }
        }

        let me_version_res = result[1];

        let me_version_update = 0;
        if (Object.keys(me_version_res).length > 0 && isJSON(me_version_res)) {
          let meVersionInfo = JSON.parse(me_version_res);
          if (meVersionInfo["version"]) {
            me_version_update = 1;
          }
        }

        if (tme_version_update == 1 && me_version_update == 1) {
          resp_obj["error"]["code"] = 0;
          resp_obj["error"]["msg"] = "Version Updated";
          return res.status(200).json(resp_obj);
        } else {
          resp_obj["error"]["code"] = 1;
          resp_obj["error"]["msg"] = "Version Not Updated";
          return res.status(200).json(resp_obj);
        }
      })
      .catch(err => {
        return res.status(500).json({error: {code: 1, msg: err.stack}});
      });
  } else {
    let versionInfo = {};
    let version_url =
      url_info["jdbox_url"] +
      "services/versioninit.php?parentid=" +
      parentid +
      "&data_city=" +
      data_city +
      "&module=tme";

    versionInfo = await curlObj.curlCall("xxx", version_url, {}, "get", {});

    if (!isEmpty(versionInfo)) {
      versionInfo = JSON.parse(versionInfo);
      if (Object.keys(versionInfo).length > 0) {
        if (versionInfo["version"]) {
          resp_obj["error"]["code"] = 0;
          resp_obj["error"]["msg"] = "Version Updated";
          resp_obj["data"] = versionInfo["version"];
          return res.status(200).json(resp_obj);
        }
      }
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Version Not Updated";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Not getting response from version API";
      return res.status(500).json(resp_obj);
    }
  }
});
exports.getGeocode = asyncMiddleware(async function(req, res) {
  req.body = trimObj(req.body);

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }
  if (isEmpty(req.body.pincode)) {
    return res.status(400).json({error: {code: 1, msg: "pincode is blank."}});
  }

  const data_city = req.body.data_city;
  const pincode = req.body.pincode;

  let resp_obj = {};
  resp_obj["error"] = {};
  resp_obj["data"] = {};
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    const geocodeInfo = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT latitude_final ,longitude_final FROM tbl_areamaster_consolidated_v3 WHERE pincode ='" +
        pincode +
        "' AND display_flag=1 LIMIT 1"
    });
    if (Object.keys(geocodeInfo).length > 0) {
      let geocodeRes = geocodeInfo[0];
      resp_obj["data"]["latitude"] = geocodeRes["latitude_final"];
      resp_obj["data"]["longitude"] = geocodeRes["longitude_final"];
      resp_obj["error"]["code"] = 0;
      resp_obj["error"]["msg"] = "Data Found";
      return res.status(200).json(resp_obj);
    } else {
      resp_obj["error"]["code"] = 1;
      resp_obj["error"]["msg"] = "Data Not Found";
      return res.status(200).json(resp_obj);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});
exports.getConTempData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }
  // Action Specific Validation
  if (isEmpty(req.body.team_type)) {
    return res.status(400).json({error: {code: 1, msg: "team_type is blank."}});
  }
  let debug = 0;
  if (!isEmpty(req.body.debug)) {
    debug = req.body.debug;
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module.toUpperCase();
  const ucode = req.body.ucode;
  const uname = req.body.uname;
  const team_type = req.body.team_type.toLowerCase();

  if (module != "TME") {
    return res.status(400).json({error: {code: 1, msg: "Invalid Module."}});
  }

  let url_info = URLINFO(data_city);
  //Fetching Connection City
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_idc = conf["idc"][conn_city];
    const conn_iro = conf["iro"][conn_city];
    const conn_tme = conf["tme_jds"][conn_city];
    const conn_fin = conf["finance"][conn_city];
    const conn_local = conf["local"][conn_city];

    // Checking entry in tbl_id_generator

    const idgenData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT data_city FROM tbl_id_generator WHERE parentid='" +
        parentid +
        "'"
    });
    if (Object.keys(idgenData).length <= 0) {
      return res.status(200).json({
        error: {
          code: 1,
          msg:
            "You cannot proceed with this contract [" +
            parentid +
            "] as there is some issue with the data city. Please contact Software Team."
        }
      });
    }
    let condatacity = idgenData[0]["data_city"].trim();

    // Restriction 1 - Active ECS contract not allowed to edit to RD/BD Team user
    const block_team = ["bd", "rd"];
    if (data_city.toLowerCase() !== "delhi" && block_team.includes(team_type)) {
      const paidInfo = await dbcon.db_query({
        conn: conn_fin,
        query:
          "SELECT parentid FROM tbl_companymaster_finance WHERE parentid='" +
          parentid +
          "' AND campaignid IN (1,2) AND (balance>0 OR (manual_override =1 AND expired = 0))"
      });
      if (Object.keys(paidInfo).length > 0) {
        const ecsEditEligib = await dbcon.db_query({
          conn: conn_idc,
          query:
            "SELECT parentid FROM db_jda.tbl_ecs_contract_edit  WHERE parentid = '" +
            parentid +
            "'"
        });

        if (Object.keys(ecsEditEligib).length <= 0) {
          const contractECSData = dbcon.db_query({
            conn: conn_fin,
            query:
              "SELECT parentid,billdeskid FROM db_ecs.ecs_mandate WHERE parentid='" +
              parentid +
              "' AND activeflag = 1 AND deactiveflag = 0 AND ecs_stop_flag = 0 AND ( mandate_type IS NULL  OR mandate_type='' OR mandate_type='JDA' ) LIMIT 1"
          });

          const contractSIData = dbcon.db_query({
            conn: conn_fin,
            query:
              "SELECT parentid,billdeskid FROM db_si.si_mandate WHERE parentid='" +
              parentid +
              "' AND activeflag = 1 and deactiveflag = 0 and ecs_stop_flag = 0 AND ( mandate_type IS NULL  OR mandate_type='' OR mandate_type='JDA' ) LIMIT 1"
          });

          Promise.all([contractECSData, contractSIData])
            .then(ecsresult => {
              let conECSRes = ecsresult[0];
              let conSIRes = ecsresult[1];
              if (
                Object.keys(conECSRes).length > 0 ||
                Object.keys(conSIRes).length > 0
              ) {
                return res.status(200).json({
                  error: {
                    code: 1,
                    msg:
                      "Active ECS contract [" +
                      parentid +
                      "] is not allowed to edit."
                  }
                });
              }
            })
            .catch(err => {
              return res.status(500).json({error: {code: 1, msg: err.stack}});
            });
        }
      }
    }

    // Restriction 2 - Contract with downsell status pending is not allowed to edit.

    let mongo_data = {};
    mongo_data["data"] = {};
    mongo_data["data"]["parentid"] = parentid;
    mongo_data["data"]["data_city"] = data_city;
    mongo_data["data"]["module"] = module;
    mongo_data["data"]["table"] = JSON.stringify({
      tbl_companymaster_generalinfo_shadow:
        "parentid,companyname,mobile,pincode",
      tbl_companymaster_extradetails_shadow: "updatedBy",
      tbl_business_temp_data: "catIds",
      tbl_temp_intermediate: "version"
    });

    let mongo_url = url_info["mongo_url"] + "api/shadowinfo/getshadowdata";
    let shadow_data = await curlObj.curlCall(
      "xxx",
      mongo_url,
      mongo_data,
      "post",
      {}
    );
    let tempgen_data = {};
    let tempextra_data = {};
    let tempbus_data = {};
    let tempinter_data = {};
    let temptbl_data = {};
    if (!isEmpty(shadow_data) && isJSON(shadow_data)) {
      shadow_data = JSON.parse(shadow_data);
      if (shadow_data["error"] == 0) {
        temptbl_data = shadow_data["data"];
        if (!isEmpty(temptbl_data["tbl_companymaster_generalinfo_shadow"])) {
          tempgen_data = temptbl_data["tbl_companymaster_generalinfo_shadow"];
        }
        if (!isEmpty(temptbl_data["tbl_companymaster_extradetails_shadow"])) {
          tempextra_data =
            temptbl_data["tbl_companymaster_extradetails_shadow"];
        }
        if (!isEmpty(temptbl_data["tbl_business_temp_data"])) {
          tempbus_data = temptbl_data["tbl_business_temp_data"];
        }
        if (!isEmpty(temptbl_data["tbl_temp_intermediate"])) {
          tempinter_data = temptbl_data["tbl_temp_intermediate"];
        }
      }
    }
    if (!isEmpty(tempinter_data)) {
      if (
        !isEmpty(tempinter_data["version"]) &&
        parseInt(tempinter_data["version"]) > 0
      ) {
        let version = tempinter_data["version"];
        const downsellStatus = await dbcon.db_query({
          conn: conn_idc,
          query:
            "SELECT status,delete_flag,request_type,dealclose_flag,module FROM online_regis.downsell_trn WHERE parentid='" +
            parentid +
            "' AND version='" +
            version +
            "' AND delete_flag!=1 ORDER BY updated_at DESC LIMIT 1"
        });
        if (Object.keys(downsellStatus).length > 0) {
          let downsellStatusRow = downsellStatus[0];
          if (downsellStatusRow["status"] == 0) {
            return res.status(200).json({
              error: {
                code: 1,
                msg:
                  "This Contract [" +
                  parentid +
                  "] Requested For DownSell & It is in Pending state. You are not allowed to edit this contract !!!"
              }
            });
          } else if (
            module == "TME" &&
            downsellStatusRow["status"] == 1 &&
            downsellStatusRow["dealclose_flag"] != 2
          ) {
            return res.status(200).json({
              error: {
                code: 1,
                msg:
                  "This Contract [" +
                  parentid +
                  "] Requested For DownSell & It is in Approved state. You are not allowed to edit this contract !!!"
              }
            });
          }
        }
      }
    }
    // Step 1 - Checking entry in tbl_lock_company

    let lock_data = {};
    lock_data["data"] = {};
    lock_data["data"]["parentid"] = parentid;
    lock_data["data"]["data_city"] = data_city;
    lock_data["data"]["module"] = module.toLowerCase();
    lock_data["data"]["ucode"] = ucode;
    lock_data["data"]["uname"] = uname;
    lock_data["data"]["post_data"] = 1;
    lock_data["data"]["skipDownsell"] = 1;

    let cs_edit_url = url_info["jdbox_url"] + "services/cs_edit_check.php";
    let cs_edit_res = await curlObj.curlCall(
      "xxx",
      cs_edit_url,
      lock_data,
      "post",
      {}
    );
    let cs_edit_result = {};
    let fetch_live = 0;
    if (Object.keys(cs_edit_res).length > 0 && isJSON(cs_edit_res)) {
      cs_edit_result = JSON.parse(cs_edit_res);
      if (!isEmpty(cs_edit_result["redirecturl"])) {
        fetch_live = 1;
      }
    }
    if (
      !isEmpty(tempextra_data["updatedBy"]) &&
      tempextra_data["updatedBy"] != ucode
    ) {
      fetch_live = 1;
    }
    // Step - 2 Cheking entry in live extrdetails table to fetch live data
    const extraDetailsData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT parentid,catidlineage FROM tbl_companymaster_extradetails WHERE parentid='" +
        parentid +
        "' "
    });

    if (Object.keys(extraDetailsData).length <= 0 && isEmpty(temptbl_data)) {
      return res.status(200).json({
        error: {
          code: 1,
          msg:
            "No data found in live / temp table for this Contract [" +
            parentid +
            "]."
        }
      });
    }

    // Step - 3 Populating attributes temp table if data found in temp / live

    const liveAttrData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT docid,parentid, city, attribute_name,attribute_dname, attribute_value, attribute_type, attribute_sub_group,sub_group_name,display_flag,sub_group_position,attribute_position,attribute_id,attribute_prefix, main_attribute_flag,main_attribute_position FROM tbl_companymaster_attributes WHERE parentid='" +
        parentid +
        "' "
    });
    if (Object.keys(liveAttrData).length > 0) {
      const deleteTempAttr = await dbcon.db_query({
        conn: conn_tme,
        query:
          "DELETE FROM tbl_companymaster_attributes_temp WHERE parentid='" +
          parentid +
          "'"
      });
      let attr_fld_val = "";
      if (Object.keys(deleteTempAttr).length > 0) {
        for (let i = 0; i < liveAttrData.length; i++) {
          let attrRow = liveAttrData[i];

          attr_fld_val +=
            " ('" +
            attrRow["docid"] +
            "', '" +
            attrRow["parentid"] +
            "', '" +
            attrRow["city"] +
            "', '" +
            addSlashes(attrRow["attribute_name"]) +
            "', '" +
            addSlashes(attrRow["attribute_dname"]) +
            "', '" +
            addSlashes(attrRow["attribute_value"]) +
            "', '" +
            attrRow["attribute_type"] +
            "' ,'" +
            attrRow["attribute_sub_group"] +
            "', '" +
            addSlashes(attrRow["sub_group_name"]) +
            "',  '" +
            attrRow["display_flag"] +
            "',  '" +
            attrRow["sub_group_position"] +
            "','" +
            attrRow["attribute_position"] +
            "', '" +
            attrRow["attribute_id"] +
            "', '" +
            attrRow["attribute_prefix"] +
            "',  '" +
            attrRow["main_attribute_flag"] +
            "' , '" +
            attrRow["main_attribute_position"] +
            "' ) " +
            ",";
        }
        attr_fld_val = _.trimEnd(attr_fld_val, ",");

        let attr_qry =
          "INSERT INTO tbl_companymaster_attributes_temp (docid,parentid, city, attribute_name,attribute_dname, attribute_value, attribute_type, attribute_sub_group,sub_group_name,display_flag,sub_group_position,attribute_position,attribute_id,attribute_prefix, main_attribute_flag,main_attribute_position) VALUES ";
        let sqlAttrInsert = attr_qry + attr_fld_val;

        const insertTempAttr = dbcon.db_query({
          conn: conn_tme,
          query: sqlAttrInsert
        });
      }
    }
    // Step 4 - Fetching Live Data

    if (Object.keys(extraDetailsData).length > 0) {
      if (fetch_live == 1) {
        req.body.temp_request = "1";
        req.body.condatacity = condatacity;
        return exports.getConLiveData(req, res);
      }
    }

    // Step - 5 Comparing shadow with live data to find out changes

    const generalData = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT parentid,companyname,mobile,pincode FROM tbl_companymaster_generalinfo WHERE parentid='" +
        parentid +
        "' "
    });

    if (
      !isEmpty(temptbl_data) &&
      Object.keys(extraDetailsData).length > 0 &&
      Object.keys(generalData).length > 0
    ) {
      let extraDetailsRow = extraDetailsData[0];
      let generalDataRow = generalData[0];

      let temp_comp = "";
      let temp_mob_arr = [];
      if (!isEmpty(tempgen_data)) {
        if (!isEmpty(tempgen_data["companyname"])) {
          temp_comp = tempgen_data["companyname"].trim();
        }
        if (!isEmpty(tempgen_data["mobile"])) {
          temp_mob_arr = tempgen_data["mobile"].split(",");
          temp_mob_arr = _.uniq(_.compact(temp_mob_arr));
        }
      }

      let live_comp = generalDataRow["companyname"].trim();
      let changed_flag = 0;
      if (temp_comp.toLowerCase() != live_comp.toLowerCase()) {
        changed_flag++;
      }
      let live_mob_arr = [];
      if (!isEmpty(generalDataRow["mobile"])) {
        live_mob_arr = generalDataRow["mobile"].split(",");
        live_mob_arr = _.uniq(_.compact(live_mob_arr));
      }

      if (
        live_mob_arr.length > 0 &&
        _.intersection(live_mob_arr, temp_mob_arr).length <= 0
      ) {
        changed_flag++;
      }

      let temp_catlin_arr = [];
      if (!isEmpty(tempbus_data)) {
        if (!isEmpty(tempbus_data["catIds"])) {
          temp_catlin_arr = tempbus_data["catIds"].split("|P|");
          temp_catlin_arr = validateCategories(temp_catlin_arr);
        }
      }
      let live_catlin_arr = [];
      if (!isEmpty(extraDetailsRow["catidlineage"])) {
        extraDetailsRow["catidlineage"] = _.trim(
          extraDetailsRow["catidlineage"],
          ","
        );

        live_catlin_arr = _
          .trim(extraDetailsRow["catidlineage"], "/")
          .split("/,/");
        live_catlin_arr = validateCategories(live_catlin_arr);
      }
      if (
        live_catlin_arr.length > 0 &&
        _.intersection(live_catlin_arr, temp_catlin_arr).length <= 0
      ) {
        changed_flag++;
      }
      if (changed_flag == 3) {
        return res.status(200).json({
          error: {
            code: 1,
            msg: "This Contract [" + parentid + "] data found to be mismatched."
          }
        });
      }
    }

    let location_details = {};
    if (condatacity.length > 0) {
      let loc_details = await dbcon.db_query({
        conn: conn_local,
        query:
          "SELECT country_id, country_name, state_id, state_name, city_id, ct_name, stdcode FROM city_master where ct_name = '" +
          condatacity +
          "' AND DE_display=1 AND display_flag=1  LIMIT 1"
      });
      if (loc_details.length > 0) {
        location_details = loc_details[0];
      } else {
        return res.status(200).json({
          error: {
            code: 1,
            msg:
              "You cannot proceed with this contract [" +
              parentid +
              "] as there is some issue with the data city. Please contact Software Team."
          }
        });
      }
    }

    //fetch_live
    if (!isEmpty(temptbl_data)) {
      return res
        .status(200)
        .json({error: {code: 0, msg: "Success"}, data: location_details});
    } else {
      req.body.temp_request = "1";
      req.body.condatacity = condatacity;
      return exports.getConLiveData(req, res);
    }
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});
exports.getConLiveData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);
  const {errors, isValid} = validateBformInput(req.body);

  // Check Validation
  if (!isValid) {
    return res.status(400).json({error: {code: 1, msg: errors}});
  }
  // Action Specific Validation
  if (isEmpty(req.body.team_type)) {
    return res.status(400).json({error: {code: 1, msg: "team_type is blank."}});
  }

  let temp_request = 0;
  if (!isEmpty(req.body.temp_request)) {
    temp_request = req.body.temp_request;
  }
  let condatacity = "";
  if (!isEmpty(req.body.condatacity)) {
    condatacity = req.body.condatacity;
  }

  let debug = 0;
  if (!isEmpty(req.body.debug)) {
    debug = req.body.debug;
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  const module = req.body.module.toUpperCase();
  const ucode = req.body.ucode;
  const uname = req.body.uname;
  const team_type = req.body.team_type.toLowerCase();

  let valid_module = ["TME", "ME"]; // Don't add any other module

  if (!valid_module.includes(module)) {
    return res.status(400).json({error: {code: 1, msg: "Invalid Module."}});
  }

  let url_info = URLINFO(data_city);
  //Fetching Connection City
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_idc = conf["idc"][conn_city];
    const conn_iro = conf["iro"][conn_city];
    const conn_local = conf["local"][conn_city];
    const conn_fin = conf["finance"][conn_city];
    let conn_temp;
    if (module == "TME") {
      conn_temp = conf["tme_jds"][conn_city];
    } else {
      // ME
      conn_temp = conf["idc"][conn_city];
    }

    // Restriction 1 - Active ECS contract not allowed to edit to RD/BD Team user
    const block_team = ["bd", "rd"];
    if (
      temp_request != 1 &&
      data_city.toLowerCase() !== "delhi" &&
      block_team.includes(team_type)
    ) {
      const paidInfo = await dbcon.db_query({
        conn: conn_fin,
        query:
          "SELECT parentid FROM tbl_companymaster_finance WHERE parentid='" +
          parentid +
          "' AND campaignid IN (1,2) AND (balance>0 OR (manual_override =1 AND expired = 0))"
      });
      if (Object.keys(paidInfo).length > 0) {
        const ecsEditEligib = await dbcon.db_query({
          conn: conn_idc,
          query:
            "SELECT parentid FROM db_jda.tbl_ecs_contract_edit  WHERE parentid = '" +
            parentid +
            "'"
        });

        if (Object.keys(ecsEditEligib).length <= 0) {
          const contractECSData = dbcon.db_query({
            conn: conn_fin,
            query:
              "SELECT parentid,billdeskid FROM db_ecs.ecs_mandate WHERE parentid='" +
              parentid +
              "' AND activeflag = 1 AND deactiveflag = 0 AND ecs_stop_flag = 0 AND ( mandate_type IS NULL  OR mandate_type='' OR mandate_type='JDA' ) LIMIT 1"
          });

          const contractSIData = dbcon.db_query({
            conn: conn_fin,
            query:
              "SELECT parentid,billdeskid FROM db_si.si_mandate WHERE parentid='" +
              parentid +
              "' AND activeflag = 1 and deactiveflag = 0 and ecs_stop_flag = 0 AND ( mandate_type IS NULL  OR mandate_type='' OR mandate_type='JDA' ) LIMIT 1"
          });

          Promise.all([contractECSData, contractSIData])
            .then(ecsresult => {
              let conECSRes = ecsresult[0];
              let conSIRes = ecsresult[1];
              if (
                Object.keys(conECSRes).length > 0 ||
                Object.keys(conSIRes).length > 0
              ) {
                return res.status(200).json({
                  error: {
                    code: 1,
                    msg: "Active ECS contract is not allowed to edit."
                  }
                });
              }
            })
            .catch(err => {
              return res.status(500).json({error: {code: 1, msg: err.stack}});
            });
        }
      }
    }

    // Restriction 2 - Contract with downsell status pending is not allowed to edit.
    if (temp_request != 1) {
      let mongo_input = {};
      mongo_input["data"] = {};
      mongo_input["data"]["parentid"] = parentid;
      mongo_input["data"]["data_city"] = data_city;
      mongo_input["data"]["module"] = module;
      mongo_input["data"]["table"] = "tbl_temp_intermediate";
      mongo_input["data"]["fields"] = "version";
      let mongo_api_url = url_info["mongo_url"] + "api/shadowinfo/getdata";
      let tempInterData = await curlObj.curlCall(
        "xxx",
        mongo_api_url,
        mongo_input,
        "post",
        {}
      );
      if (!isEmpty(tempInterData)) {
        tempInterData = JSON.parse(tempInterData);

        if (tempInterData["error"] == 0) {
          let tempInterRow = tempInterData["data"];
          if (
            !isEmpty(tempInterRow["version"]) &&
            parseInt(tempInterRow["version"]) > 0
          ) {
            let version = tempInterRow["version"];
            const downsellStatus = await dbcon.db_query({
              conn: conn_idc,
              query:
                "SELECT status,delete_flag,request_type,dealclose_flag,module FROM online_regis.downsell_trn WHERE parentid='" +
                parentid +
                "' AND version='" +
                version +
                "' AND delete_flag!=1 ORDER BY updated_at DESC LIMIT 1"
            });
            if (Object.keys(downsellStatus).length > 0) {
              let downsellStatusRow = downsellStatus[0];
              if (downsellStatusRow["status"] == 0) {
                return res.status(200).json({
                  error: {
                    code: 1,
                    msg:
                      "This Contract [" +
                      parentid +
                      "] Requested For DownSell & It is in Pending state. You are not allowed to edit this contract !!!"
                  }
                });
              } else if (
                module == "TME" &&
                downsellStatusRow["status"] == 1 &&
                downsellStatusRow["dealclose_flag"] != 2
              ) {
                return res.status(200).json({
                  error: {
                    code: 1,
                    msg:
                      "This Contract [" +
                      parentid +
                      "] Requested For DownSell & It is in Approved state. You are not allowed to edit this contract !!!"
                  }
                });
              }
            }
          }
        }
      }
    }

    let debug_resp = {};
    let start_time = [];
    let end_time = [];
    let taken_time = [];
    if (debug) {
      debug_resp["Process Start Time"] = moment().format("H:mm:ss");
      start_time[1] = new Date();
    }

    //Step 1 : Populating Mongo Shadow Tables

    const genLive = dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT nationalid,sphinx_id,regionid,companyname,parentid,country,state,city,display_city,area,subarea,office_no,building_name,street,street_direction,street_suffix,landmark,landmark_custom,pincode,pincode_addinfo,latitude,longitude,geocode_accuracy_level,full_address,stdcode,landline,landline_display,landline_feedback,mobile,	mobile_display,	mobile_feedback,fax,tollfree,tollfree_display,email,email_display,email_feedback,sms_scode,website,contact_person,contact_person_display,callconnect,virtualNumber,virtual_mapped_number,blockforvirtual,othercity_number,paid,displayType,company_callcnt,company_callcnt_rolling,hide_address,data_city,mobile_admin FROM tbl_companymaster_generalinfo WHERE parentid = '" +
        parentid +
        "'"
    });

    const extraLive = await dbcon.db_query({
      conn: conn_iro,
      query:
        "SELECT nationalid,sphinx_id,regionid,companyname,parentid,landline_addinfo,mobile_addinfo,tollfree_addinfo,contact_person_addinfo,attributes,attributes_edit,attribute_search,turnover,working_time_start,working_time_end,payment_type,year_establishment,accreditations,certificates,no_employee,business_group,email_feedback_freq,statement_flag,alsoServeFlag,averageRating,ratings,web_ratings,number_of_reviews,group_id,guarantee,Jdright,LifestyleTag,contract_calltype,batch_group,audit_status,createdby,createdtime,customerID,datavalidity_flag,deactflg,display_flag,fmobile,femail,flgActive,freeze,mask,future_contract_flag,hidden_flag,lockDateTime,lockedBy,temp_deactive_start,temp_deactive_end,micrcode,prompt_cat_temp,promptype,referto,serviceName,srcEmp,telComm,createdby,createdtime,original_creator,original_date,updatedBy,updatedOn,map_pointer_flags,flags,catidlineage,catidlineage_nonpaid,national_catidlineage_nonpaid,award,testimonial,proof_establishment,data_city, closedown_flag,tag_catid,tag_catname FROM tbl_companymaster_extradetails WHERE parentid = '" +
        parentid +
        "'"
    });
    let catdata = {};
    if (Object.keys(extraLive).length > 0) {
      let extraDataRow = extraLive[0];
      let live_catlin_arr = [];
      if (!isEmpty(extraDataRow["catidlineage"])) {
        extraDataRow["catidlineage"] = _.trim(
          extraDataRow["catidlineage"],
          ","
        );

        live_catlin_arr = _
          .trim(extraDataRow["catidlineage"], "/")
          .split("/,/");
        live_catlin_arr = validateCategories(live_catlin_arr);
      }
      if (live_catlin_arr.length > 0) {
        let category_obj = new CategoryClass();
        let catparam = {};
        catparam["data_city"] = data_city;
        catparam["module"] = module;
        catparam["return"] = "catid,category_name,national_catid";
        catparam["where"] = JSON.stringify({
          catid: live_catlin_arr.join(",")
        });
        catdata = await category_obj.catInfo(catparam);
      }
    }
    const reasonInfo = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT reason_id,reasons,reason_text FROM tbl_contract_reasons WHERE contractid = '" +
        parentid +
        "'"
    });

    const addInfoTxt = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT add_infotxt FROM tbl_comp_addInfo where contractId ='" +
        parentid +
        "' ORDER BY lockdateTime DESC LIMIT 1"
    });

    const sourceInfo = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT mainsource,subsource,datesource FROM tbl_company_source WHERE parentid='" +
        parentid +
        "' ORDER BY csid DESC LIMIT 1"
    });

    const tmeInfo = dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT employeeCode,iroCode,meCode,mCode,tmeCode,tmeName FROM tbl_contract_tmeDetails WHERE contractid='" +
        parentid +
        "'"
    });

    Promise.all([
      genLive,
      extraLive,
      catdata,
      reasonInfo,
      addInfoTxt,
      sourceInfo,
      tmeInfo
    ])
      .then(async result => {
        let genDataRes = result[0];

        let temp_data_obj = {};
        let gendata = {};
        let edit_flag = 0;
        if (Object.keys(genDataRes).length > 0) {
          edit_flag = 1;
          let genDataRow = genDataRes[0];
          gendata = {
            updatedata: {
              companyname: stripslashes(genDataRow["companyname"]),
              country: genDataRow["country"],
              state: genDataRow["state"],
              city: genDataRow["city"],
              display_city: genDataRow["display_city"],
              area: genDataRow["area"],
              subarea: genDataRow["subarea"],
              office_no: genDataRow["office_no"],
              building_name: genDataRow["building_name"],
              street: genDataRow["street"],
              street_direction: genDataRow["street_direction"],
              street_suffix: genDataRow["street_suffix"],
              landmark: genDataRow["landmark"],
              landmark_custom: genDataRow["landmark_custom"],
              pincode: genDataRow["pincode"],
              pincode_addinfo: genDataRow["pincode_addinfo"],
              latitude: genDataRow["latitude"],
              longitude: genDataRow["longitude"],
              geocode_accuracy_level: genDataRow["geocode_accuracy_level"],
              full_address: genDataRow["full_address"],
              stdcode: genDataRow["stdcode"],
              landline: genDataRow["landline"],
              landline_display: genDataRow["landline_display"],
              landline_feedback: genDataRow["landline_feedback"],
              mobile: genDataRow["mobile"],
              mobile_display: genDataRow["mobile_display"],
              mobile_feedback: genDataRow["mobile_feedback"],
              fax: genDataRow["fax"],
              tollfree: genDataRow["tollfree"],
              tollfree_display: genDataRow["tollfree_display"],
              email: genDataRow["email"],
              email_display: genDataRow["email_display"],
              email_feedback: genDataRow["email_feedback"],
              sms_scode: genDataRow["sms_scode"],
              website: genDataRow["website"],
              contact_person: genDataRow["contact_person"],
              contact_person_display: genDataRow["contact_person_display"],
              callconnect: genDataRow["callconnect"],
              othercity_number: genDataRow["othercity_number"],
              paid: genDataRow["paid"],
              displayType: genDataRow["displayType"],
              company_callcnt: genDataRow["company_callcnt"],
              company_callcnt_rolling: genDataRow["company_callcnt_rolling"],
              hide_address: genDataRow["hide_address"],
              data_city: genDataRow["data_city"],
              mobile_admin: genDataRow["mobile_admin"]
            },
            insertdata: {
              nationalid: genDataRow["nationalid"],
              sphinx_id: genDataRow["sphinx_id"],
              regionid: genDataRow["regionid"]
            }
          };
          temp_data_obj["tbl_companymaster_generalinfo_shadow"] = gendata;
        }

        let catDataRes = result[2];
        let catnames_str = "";
        let catids_str = "";
        let national_catids_str = "";
        let catSelected = "";
        let catids_arr = [];
        let catnames_arr = [];
        let national_catids_arr = [];
        if (Object.keys(catDataRes).length > 0) {
          if (catDataRes["error"] === 0) {
            catDataRes["data"].forEach(function(catdetails) {
              catids_arr.push(catdetails["catid"]);
              catnames_arr.push(catdetails["category_name"]);
              national_catids_arr.push(catdetails["national_catid"]);
            });
            catids_str = "|P|";
            catids_str += catids_arr.join("|P|");

            catnames_str = "|P|";
            catnames_str += catnames_arr.join("|P|");

            national_catids_str = "|P|";
            national_catids_str += national_catids_arr.join("|P|");

            catSelected = "|~|";
            catSelected += catnames_arr.join("|~|");
          }
        }
        let extraDataRes = result[1];
        let extradata = {};
        let bustmpdata = {};
        let intermdata = {};

        if (Object.keys(extraDataRes).length > 0) {
          let extraDataRow = extraDataRes[0];
          extradata = {
            updatedata: {
              companyname: stripslashes(extraDataRow["companyname"]),
              landline_addinfo: extraDataRow["landline_addinfo"],
              mobile_addinfo: extraDataRow["mobile_addinfo"],
              tollfree_addinfo: extraDataRow["tollfree_addinfo"],
              contact_person_addinfo: extraDataRow["contact_person_addinfo"],
              attributes: extraDataRow["attributes"],
              attributes_edit: extraDataRow["attributes_edit"],
              attribute_search: extraDataRow["attribute_search"],
              turnover: extraDataRow["turnover"],
              working_time_start: extraDataRow["working_time_start"],
              working_time_end: extraDataRow["working_time_end"],
              payment_type: extraDataRow["payment_type"],
              year_establishment: extraDataRow["year_establishment"],
              certificates: extraDataRow["certificates"],
              no_employee: extraDataRow["no_employee"],
              business_group: extraDataRow["business_group"],
              email_feedback_freq: extraDataRow["email_feedback_freq"],
              statement_flag: extraDataRow["statement_flag"],
              alsoServeFlag: extraDataRow["alsoServeFlag"],
              averageRating: extraDataRow["averageRating"],
              ratings: extraDataRow["ratings"],
              web_ratings: extraDataRow["web_ratings"],
              number_of_reviews: extraDataRow["number_of_reviews"],
              group_id: extraDataRow["group_id"],
              guarantee: extraDataRow["guarantee"],
              Jdright: extraDataRow["Jdright"],
              LifestyleTag: extraDataRow["LifestyleTag"],
              contract_calltype: extraDataRow["contract_calltype"],
              batch_group: extraDataRow["batch_group"],
              audit_status: extraDataRow["audit_status"],
              customerID: extraDataRow["customerID"],
              datavalidity_flag: extraDataRow["datavalidity_flag"],
              deactflg: extraDataRow["deactflg"],
              display_flag: extraDataRow["display_flag"],
              fmobile: extraDataRow["fmobile"],
              femail: extraDataRow["femail"],
              flgActive: extraDataRow["flgActive"],
              freeze: extraDataRow["freeze"],
              mask: extraDataRow["mask"],
              future_contract_flag: extraDataRow["future_contract_flag"],
              hidden_flag: extraDataRow["hidden_flag"],
              lockDateTime: extraDataRow["lockDateTime"],
              lockedBy: extraDataRow["lockedBy"],
              temp_deactive_start: extraDataRow["temp_deactive_start"],
              temp_deactive_end: extraDataRow["temp_deactive_end"],
              micrcode: extraDataRow["micrcode"],
              prompt_cat_temp: extraDataRow["prompt_cat_temp"],
              promptype: extraDataRow["promptype"],
              referto: extraDataRow["referto"],
              serviceName: extraDataRow["serviceName"],
              srcEmp: extraDataRow["srcEmp"],
              telComm: extraDataRow["telComm"],
              updatedBy: extraDataRow["updatedBy"],
              updatedOn: extraDataRow["updatedOn"],
              map_pointer_flags: extraDataRow["map_pointer_flags"],
              flags: extraDataRow["flags"],
              catidlineage_nonpaid: extraDataRow["catidlineage_nonpaid"],
              national_catidlineage_nonpaid:
                extraDataRow["national_catidlineage_nonpaid"],
              award: extraDataRow["award"],
              testimonial: extraDataRow["testimonial"],
              proof_establishment: extraDataRow["proof_establishment"],
              data_city: extraDataRow["data_city"]
            },
            insertdata: {
              nationalid: extraDataRow["nationalid"],
              sphinx_id: extraDataRow["sphinx_id"],
              regionid: extraDataRow["regionid"],
              createdby: extraDataRow["createdby"],
              createdtime: extraDataRow["createdtime"],
              original_creator: extraDataRow["original_creator"],
              original_date: extraDataRow["original_date"]
            }
          };
          temp_data_obj["tbl_companymaster_extradetails_shadow"] = extradata;

          bustmpdata = {
            updatedata: {
              companyName: stripslashes(extraDataRow["companyname"]),
              mainattr: extraDataRow["attributes"],
              facility: extraDataRow["attributes_edit"],
              categories: catnames_str,
              catIds: catids_str,
              nationalcatIds: national_catids_str,
              catSelected: catSelected,
              categories_list: ""
            }
          };
          temp_data_obj["tbl_business_temp_data"] = bustmpdata;

          let reasonRes = result[3];
          let reason_id = "",
            reason_text = "";
          if (Object.keys(reasonRes).length > 0) {
            let reasonRow = reasonRes[0];
            reason_id = reasonRow["reason_id"];
            reason_text = reasonRow["reason_text"];
          }

          let addinfoRes = result[4];
          let add_infotxt = "";
          if (Object.keys(addinfoRes).length > 0) {
            let addinfoRow = addinfoRes[0];
            add_infotxt = addinfoRow["add_infotxt"];
          }

          let srcinfoRes = result[5];
          let mainsource = "",
            subsource = "",
            datesource = "";
          if (Object.keys(srcinfoRes).length > 0) {
            let srcinfoRow = srcinfoRes[0];
            mainsource = srcinfoRow["mainsource"];
            subsource = srcinfoRow["subsource"];
            datesource = srcinfoRow["datesource"];
          }

          let tmeinfoRes = result[6];
          let employeeCode = "",
            iroCode = "",
            meCode = "",
            mCode = "",
            tmeCode = "";

          if (Object.keys(tmeinfoRes).length > 0) {
            let tmeinfoRow = tmeinfoRes[0];
            employeeCode = tmeinfoRow["employeeCode"];
            iroCode = tmeinfoRow["iroCode"];
            meCode = tmeinfoRow["meCode"];
            mCode = tmeinfoRow["mCode"];
            tmeCode = tmeinfoRow["tmeCode"];
          }

          intermdata = {
            updatedata: {
              contract_calltype: extraDataRow["contract_calltype"],
              displayType: extraDataRow["displayType"],
              deactivate: extraDataRow["deactivate"],
              temp_deactive_start: extraDataRow["temp_deactive_start"],
              temp_deactive_end: extraDataRow["temp_deactive_end"],
              deactflg: extraDataRow["deactflg"],
              freez: extraDataRow["freez"],
              mask: extraDataRow["mask"],
              reason_id: reason_id,
              reason_text: reason_text,
              add_infotxt: add_infotxt,
              mainsource: mainsource,
              subsource: subsource,
              datesource: datesource,
              empcode: employeeCode,
              name_code: iroCode,
              txtTE: meCode,
              txtM: mCode,
              txtME: tmeCode,
              assignTmeCode: tmeCode,
              actMode: 1,
              facility_flag: 0,
              nonpaid: 0,
              cat_reset_flag: 0
            },
            insertdata: {
              tme_code: tmeCode
            }
          };
          temp_data_obj["tbl_temp_intermediate"] = intermdata;
        }
        let error_found = 0;
        try {
          if (Object.keys(temp_data_obj).length > 0) {
            let mongo_data = {};
            mongo_data["data"] = {};
            mongo_data["data"]["parentid"] = parentid;
            mongo_data["data"]["data_city"] = data_city;
            mongo_data["data"]["module"] = module;

            mongo_data["data"]["table_data"] = JSON.stringify(temp_data_obj);
            let mongo_url = url_info["mongo_url"] + "api/shadowinfo/insertdata";
            let shadow_data = await curlObj.curlCall(
              "xxx",
              mongo_url,
              mongo_data,
              "post",
              {}
            );

            if (Object.keys(shadow_data).length > 0) {
              shadow_data = JSON.parse(shadow_data);
              if (shadow_data["error"] !== 0) {
                error_found = 1;
              }
            } else {
              error_found = 1;
            }
          }

          if (debug) {
            end_time[1] = new Date();
            taken_time[1] =
              (end_time[1].getTime() - start_time[1].getTime()) / 1000;
            debug_resp["1"] = {};
            debug_resp["1"]["action"] = "Populating Temp Tables";
            debug_resp["1"]["takentime"] = taken_time[1];
            debug_resp["1"]["error_found"] = error_found;
          }

          // Step 2 - Populating attributes temp table
          if (debug) {
            start_time[2] = new Date();
          }
          if (temp_request != 1) {
            const liveAttrData = await dbcon.db_query({
              conn: conn_iro,
              query:
                "SELECT docid,parentid, city, attribute_name,attribute_dname, attribute_value, attribute_type, attribute_sub_group,sub_group_name,display_flag,sub_group_position,attribute_position,attribute_id,attribute_prefix, main_attribute_flag,main_attribute_position FROM tbl_companymaster_attributes WHERE parentid='" +
                parentid +
                "' "
            });
            if (Object.keys(liveAttrData).length > 0) {
              const deleteTempAttr = await dbcon.db_query({
                conn: conn_temp,
                query:
                  "DELETE FROM tbl_companymaster_attributes_temp WHERE parentid='" +
                  parentid +
                  "'"
              });
              let attr_fld_val = "";
              if (Object.keys(deleteTempAttr).length > 0) {
                for (let i = 0; i < liveAttrData.length; i++) {
                  let attrRow = liveAttrData[i];

                  attr_fld_val +=
                    " ('" +
                    attrRow["docid"] +
                    "', '" +
                    attrRow["parentid"] +
                    "', '" +
                    attrRow["city"] +
                    "', '" +
                    addSlashes(attrRow["attribute_name"]) +
                    "', '" +
                    addSlashes(attrRow["attribute_dname"]) +
                    "', '" +
                    addSlashes(attrRow["attribute_value"]) +
                    "', '" +
                    attrRow["attribute_type"] +
                    "' ,'" +
                    attrRow["attribute_sub_group"] +
                    "', '" +
                    addSlashes(attrRow["sub_group_name"]) +
                    "',  '" +
                    attrRow["display_flag"] +
                    "',  '" +
                    attrRow["sub_group_position"] +
                    "','" +
                    attrRow["attribute_position"] +
                    "', '" +
                    attrRow["attribute_id"] +
                    "', '" +
                    attrRow["attribute_prefix"] +
                    "',  '" +
                    attrRow["main_attribute_flag"] +
                    "' , '" +
                    attrRow["main_attribute_position"] +
                    "' ) " +
                    ",";
                }
                attr_fld_val = _.trimEnd(attr_fld_val, ",");

                let attr_qry =
                  "INSERT INTO tbl_companymaster_attributes_temp (docid,parentid, city, attribute_name,attribute_dname, attribute_value, attribute_type, attribute_sub_group,sub_group_name,display_flag,sub_group_position,attribute_position,attribute_id,attribute_prefix, main_attribute_flag,main_attribute_position) VALUES ";
                let sqlAttrInsert = attr_qry + attr_fld_val;

                const insertTempAttr = dbcon.db_query({
                  conn: conn_temp,
                  query: sqlAttrInsert
                });
              }
            }
          }
          if (debug) {
            end_time[2] = new Date();
            taken_time[2] =
              (end_time[2].getTime() - start_time[2].getTime()) / 1000;
            debug_resp["2"] = {};
            debug_resp["2"]["action"] = "Attribute Temp Tables";
            debug_resp["2"]["takentime"] = taken_time[2];
            debug_resp["2"]["error_found"] = error_found;
          }
          // Step 3 - Populating Finance + National Listing temp tables
          if (debug) {
            start_time[3] = new Date();
          }
          let fin_data = {};
          fin_data["data"] = {};
          fin_data["data"]["parentid"] = parentid;
          fin_data["data"]["data_city"] = data_city;
          fin_data["data"]["module"] = module.toLowerCase();
          fin_data["data"]["ucode"] = ucode;
          fin_data["data"]["uname"] = uname;

          let fin_url = url_info["jdbox_url"] + "finance/contract_data_api.php";
          let fin_res = await curlObj.curlCall(
            "xxx",
            fin_url,
            fin_data,
            "post",
            {}
          );

          let fin_result = {};
          if (Object.keys(fin_res).length > 0 && isJSON(fin_res)) {
            fin_result = JSON.parse(fin_res);
            if (fin_result["ERRCODE"] != 1) {
              error_found = 1;
            }
          } else {
            error_found = 1;
          }

          if (debug) {
            end_time[3] = new Date();
            taken_time[3] =
              (end_time[3].getTime() - start_time[3].getTime()) / 1000;
            debug_resp["3"] = {};
            debug_resp["3"]["action"] =
              "Populating Finance + National Listing temp tables";
            debug_resp["3"]["API"] = fin_url;
            debug_resp["3"]["params"] = JSON.stringify(fin_data["data"]);
            debug_resp["3"]["response"] = fin_res;
            debug_resp["3"]["takentime"] = taken_time[3];
            debug_resp["3"]["error_found"] = error_found;
          }

          // Step 4 - Populating OMNI temp tables (tbl_omni_ecs_details)
          if (debug) {
            start_time[4] = new Date();
          }
          let omni_data = {};
          omni_data["data"] = {};
          omni_data["data"]["parentid"] = parentid;
          omni_data["data"]["data_city"] = data_city;
          omni_data["data"]["module"] = module.toLowerCase();
          omni_data["data"]["action"] = 5;

          if (conn_city == "remote") {
            omni_data["data"]["remote"] = 1;
          }

          let omni_url =
            url_info["jdbox_url"] + "services/ecs_mandate_form.php";
          let omni_res = curlObj.curlCall(
            "xxx",
            omni_url,
            omni_data,
            "post",
            {}
          );
          if (debug) {
            end_time[4] = new Date();
            taken_time[4] =
              (end_time[4].getTime() - start_time[4].getTime()) / 1000;
            debug_resp["4"] = {};
            debug_resp["4"]["action"] =
              "Populating OMNI temp tables (tbl_omni_ecs_details)";
            debug_resp["4"]["API"] = omni_url;
            debug_resp["4"]["params"] = JSON.stringify(omni_data["data"]);
            debug_resp["4"]["takentime"] = taken_time[4];
            debug_resp["4"]["error_found"] = error_found;
          }
          // Step 5 - Populating Category Sponsorship temp tables
          if (debug) {
            start_time[5] = new Date();
          }
          let catspon_data = {};
          catspon_data["data"] = {};
          catspon_data["data"]["parentid"] = parentid;
          catspon_data["data"]["s_deptCity"] = data_city;
          catspon_data["data"]["module"] = module.toLowerCase();
          catspon_data["data"]["action"] = "getContractData";

          let catspon_url =
            url_info["cs_url"] + "business/textbannersponservice.php";
          let catspon_res = curlObj.curlCall(
            "xxx",
            catspon_url,
            catspon_data,
            "post",
            {}
          );
          if (debug) {
            end_time[5] = new Date();
            taken_time[5] =
              (end_time[5].getTime() - start_time[5].getTime()) / 1000;
            debug_resp["5"] = {};
            debug_resp["5"]["action"] =
              "Populating Category Sponsorship temp tables";
            debug_resp["5"]["API"] = catspon_url;
            debug_resp["5"]["params"] = JSON.stringify(catspon_data["data"]);
            debug_resp["5"]["takentime"] = taken_time[5];
            debug_resp["5"]["error_found"] = error_found;
          }

          // Step 6 - Populating Banner temp tables

          if (debug) {
            start_time[6] = new Date();
          }
          let banner_data = {};
          banner_data["data"] = {};
          banner_data["data"]["parentid"] = parentid;
          banner_data["data"]["s_deptCity"] = data_city;
          banner_data["data"]["module"] = module.toLowerCase();
          banner_data["data"]["type"] = 5;
          banner_data["data"]["state"] = 1;
          banner_data["data"]["action"] = "mainToTemp";

          let banner_url = url_info["cs_url"] + "business/bannerservice.php";
          let banner_res = curlObj.curlCall(
            "xxx",
            banner_url,
            banner_data,
            "post",
            {}
          );
          if (debug) {
            end_time[6] = new Date();
            taken_time[6] =
              (end_time[6].getTime() - start_time[6].getTime()) / 1000;
            debug_resp["6"] = {};
            debug_resp["6"]["action"] = "Populating Banner temp tables";
            debug_resp["6"]["API"] = banner_url;
            debug_resp["6"]["params"] = JSON.stringify(banner_data["data"]);
            debug_resp["6"]["takentime"] = taken_time[6];
            debug_resp["6"]["error_found"] = error_found;
          }

          // Step 7 - Populating Budget temp tables (124 Server)

          if (debug) {
            start_time[7] = new Date();
          }
          let budget_data = {};
          budget_data["data"] = {};
          budget_data["data"]["parentid"] = parentid;
          budget_data["data"]["data_city"] = data_city;
          budget_data["data"]["module"] = module.toLowerCase();
          budget_data["data"]["action"] = "updatetemptable";
          budget_data["data"]["usercode"] = ucode;
          budget_data["data"]["username"] = uname;

          let budget_url =
            url_info["jdbox_url"] + "services/getcontractapi.php";
          let budget_res = await curlObj.curlCall(
            "xxx",
            budget_url,
            budget_data,
            "post",
            {}
          );
          let budget_result = {};
          let budget_success = 0;
          if (Object.keys(budget_res).length > 0 && isJSON(budget_res)) {
            budget_result = JSON.parse(budget_res);
            if (
              !isEmpty(budget_result["error"]) &&
              budget_result["error"]["code"] == 0
            ) {
              budget_success = 1;
            }
          }
          if (debug) {
            end_time[7] = new Date();
            taken_time[7] =
              (end_time[7].getTime() - start_time[7].getTime()) / 1000;
            debug_resp["7"] = {};
            debug_resp["7"]["action"] =
              "Populating Budget temp tables (124 Server)";
            debug_resp["7"]["API"] = budget_url;
            debug_resp["7"]["params"] = JSON.stringify(budget_data["data"]);
            debug_resp["7"]["response"] = budget_res;
            debug_resp["7"]["takentime"] = taken_time[7];
            debug_resp["7"]["error_found"] = error_found;
          }
          // Step 8 - SMS Promo temp tables

          if (debug) {
            start_time[8] = new Date();
          }
          let smspromo_data = {};
          smspromo_data["data"] = {};
          smspromo_data["data"]["parentid"] = parentid;
          smspromo_data["data"]["data_city"] = data_city;
          smspromo_data["data"]["module"] = module.toLowerCase();
          smspromo_data["data"]["action"] = "updatetemptable";
          smspromo_data["data"]["usercode"] = ucode;
          smspromo_data["data"]["username"] = uname;

          let smspromo_url =
            url_info["jdbox_url"] + "services/fetch_update_sms_promo.php";
          let smspromo_res = curlObj.curlCall(
            "xxx",
            smspromo_url,
            smspromo_data,
            "post",
            {}
          );
          if (debug) {
            end_time[8] = new Date();
            taken_time[8] =
              (end_time[8].getTime() - start_time[8].getTime()) / 1000;
            debug_resp["8"] = {};
            debug_resp["8"]["action"] = "SMS Promo temp tables";
            debug_resp["8"]["API"] = smspromo_url;
            debug_resp["8"]["params"] = JSON.stringify(smspromo_data["data"]);
            debug_resp["8"]["takentime"] = taken_time[8];
            debug_resp["8"]["error_found"] = error_found;
          }
          // Step 9 - Updating tbl_lock_company Table
          let where_str = "";
          if (module == "TME") {
            where_str = " tme_updateflag = 0,updateflag	= 0";
          } else if (module == "ME") {
            where_str = " me_updateflag  = 0,updateflag  = 0	";
          }
          if (!isEmpty(where_str)) {
            const updtLockCompany = dbcon.db_query({
              conn: conn_local,
              query:
                "UPDATE tbl_lock_company SET " +
                where_str +
                " ,updatedDate = NOW() WHERE parentid ='" +
                parentid +
                "'"
            });
          }
          // Its being used in jda_services/jdadealcloseservice.php ME module
          if (module == "ME") {
            const csFetchInfo = dbcon.db_query({
              conn: conn_idc,
              query:
                "INSERT INTO tbl_cs_fetch_info SET parentid 	= '" +
                parentid +
                "',edit_flag 	= '" +
                edit_flag +
                "',updatedate 	= NOW() ON DUPLICATE KEY UPDATE edit_flag 	= '" +
                edit_flag +
                "', updatedate 	= NOW()"
            });
          }

          let location_details = {};

          if (!isEmpty(condatacity)) {
            let loc_details = await dbcon.db_query({
              conn: conn_local,
              query:
                "SELECT country_id, country_name, state_id, state_name, city_id, ct_name, stdcode FROM city_master where ct_name = '" +
                condatacity +
                "' AND DE_display=1 AND display_flag=1  LIMIT 1"
            });
            if (loc_details.length > 0) {
              location_details = loc_details[0];
            }
          }

          if (debug) {
            let curtime = new Date();
            let total_time =
              (curtime.getTime() - start_time[1].getTime()) / 1000;
            debug_resp["Process End Time"] = moment().format("H:mm:ss");
            debug_resp["Total Time Taken"] = total_time;
          }

          if (error_found == 1) {
            return res
              .status(200)
              .json({error: {code: 1, msg: "Fail", debug: debug_resp}});
          } else {
            return res.status(200).json({
              error: {code: 0, msg: "Success", debug: debug_resp},
              data: location_details
            });
          }
        } catch (exp) {
          let exp_msg = exp.stack || exp;
          return res.status(500).json({error: {code: 1, msg: exp_msg}});
        }
      })
      .catch(err => {
        return res.status(500).json({error: {code: 1, msg: err.stack}});
      });
  } else {
    return res
      .status(500)
      .json({error: {code: 1, msg: "Not able to identify conn_city"}});
  }
});

exports.getLocData = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);

  // Action Specific Validation
  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "city is blank."}});
  }

  let debug = 0;
  if (!isEmpty(req.body.debug)) {
    debug = req.body.debug;
  }

  // Assigning Params
  const data_city = req.body.data_city.toLowerCase().trim();
  let location_details = {};

  let url_info = URLINFO(data_city);
  let conn_city_obj = new ConnCity();
  const conninfo = await conn_city_obj.getConnCity(req.body);
  if (conninfo.err === 0) {
    const conn_city = conninfo.conn_city;
    const conn_local = conf["local"][conn_city];

    let loc_details = await dbcon.db_query({
      conn: conn_local,
      query:
        "SELECT country_id, country_name, state_id, state_name, city_id, ct_name, stdcode, dialer_mapped_cityname FROM city_master where ct_name = '" +
        data_city +
        "' AND DE_display=1 AND display_flag=1  LIMIT 1"
    });

    if (loc_details.length > 0) {
      location_details = loc_details[0];

      return res
        .status(200)
        .json({error: {code: 0, msg: "Success"}, data: location_details});
    } else {
      return res.status(200).json({
        error: {
          code: 1,
          msg:
            "You cannot proceed with this contract as there is some issue with the data city. Please contact Software Team."
        }
      });
    }
  }
});

exports.sendEditListingLink = asyncMiddleware(async function(req, res) {
  //Removing Spaces
  req.body = trimObj(req.body);

  // Action Specific Validation

  if (isEmpty(req.body.parentid)) {
    return res.status(400).json({error: {code: 1, msg: "parentid is blank."}});
  }

  if (isEmpty(req.body.data_city)) {
    return res.status(400).json({error: {code: 1, msg: "data_city is blank."}});
  }

  if (isEmpty(req.body.email) && isEmpty(req.body.mobile_feedback)) {
    return res
      .status(400)
      .json({error: {code: 1, msg: "Mobile Feedback/ Emailid is blank."}});
  }

  let contact_person = "Sir/Madam";
  if (!isEmpty(req.body.contact_person)) {
    contact_person = capitalize(req.body.contact_person);
  }

  // Assigning Params
  const parentid = req.body.parentid;
  const data_city = req.body.data_city;
  let mobile = "";
  if (!isEmpty(req.body.mobile_feedback)) {
    let mobile_feedback = req.body.mobile_feedback;
    let mobile_arr = mobile_feedback.split(",");
    mobile = mobile_arr[0];
  }

  let emailid = "";
  if (!isEmpty(req.body.email)) {
    let email = req.body.email;
    let email_arr = email.split(",");
    emailid = email_arr[0];
  }

  let url_info = URLINFO(data_city);

  let irocard_data = {};
  let irocard_url =
    url_info["iro_url"] +
    "mvc/services/company/getcards?type=medium&parentid=" +
    parentid +
    "&city=" +
    data_city;

  irocard_data = await curlObj.curlCall("xxx", irocard_url, {}, "get", {});

  if (!isEmpty(irocard_data)) {
    irocard_data = JSON.parse(irocard_data);
    if (!isEmpty(irocard_data["results"])) {
      let medium_data = irocard_data["results"]["data"]["medium"];
      if (!isEmpty(medium_data) && !isEmpty(medium_data.shorturl)) {
        let shorturl = medium_data.shorturl;
        let smssent = 0;
        let emailsent = 0;
        let smsemail_obj = new SMSEmailClass();
        if (mobile.length === 10) {
          let sms_text =
            "Dear " +
            contact_person +
            ", you can check/edit/update your listing by just clicking http://jsdl.in/" +
            shorturl +
            " at any point of time. Call 8888888888 for any queries - Team Just Dial";
          let smsres = {};
          let smsdata = {};
          smsdata["parentid"] = parentid;
          smsdata["data_city"] = data_city;
          smsdata["mobile"] = mobile;
          smsdata["sms_text"] = sms_text;
          smsdata["source"] = "TME-EDITLINK";
          smsres = await smsemail_obj.sendSMS(smsdata);
          if (!isEmpty(smsres)) {
            if (smsres.error === 0) {
              smssent = 1;
            }
          }
        }
        if (!isEmpty(emailid)) {
          let email_text = "Dear " + contact_person + " </p>";

          email_text += "<p>Greetings of the day from Team Justdial,</p>";
          email_text +=
            "<p>Its important that you check your company details on our website www.justdial.com and in case of any changes required, please change/edit the same by just clicking below URL at any point of time.</p>";
          email_text +=
            "<p>Click on the link below for edit or changes in your listing and upload photograph, catalogue, video and logo 24x7.</p>";
          let editlink = "http://jsdl.in/" + shorturl;
          email_text += "<a href=" + editlink + ">Link to edit</a><br><br>";
          email_text += "<p>Best Regards,<br> Team Justdial</p>";
          email_text +=
            "<p>PS: If you need assistance please call Customer Service on 8888888888 .</p>";

          let emailres = {};
          let emaildata = {};
          emaildata["parentid"] = parentid;
          emaildata["data_city"] = data_city;
          emaildata["email_id"] = emailid;
          emaildata["email_subject"] =
            "IMPORTANT - Check your Business Profile";
          emaildata["email_text"] = email_text;
          emaildata["sender_email"] = "noreply@justdial.com";
          emaildata["source"] = "TME-EDITLINK";
          emailres = await smsemail_obj.sendEmail(emaildata);
          if (!isEmpty(emailres)) {
            if (emailres.error === 0) {
              emailsent = 1;
            }
          }
        }

        if (smssent === 1 && emailsent === 1) {
          return res
            .status(200)
            .json({error: {code: 0, msg: "SMS / Email Sent."}});
        } else if (smssent === 1) {
          return res.status(200).json({error: {code: 0, msg: "SMS Sent."}});
        } else if (emailsent === 1) {
          return res.status(200).json({error: {code: 0, msg: "Email Sent."}});
        } else {
          return res
            .status(200)
            .json({error: {code: 0, msg: "SMS / Email Not Sent."}});
        }
      }
    }
  }
  return res.status(200).json({error: {code: 1, msg: "Short URL Not Found."}});
});
