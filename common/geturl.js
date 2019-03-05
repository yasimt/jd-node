const _ = require("lodash");
const config_obj = require(__basedir + "/config/paths");
const {mainCityArr} = require(__basedir + "/app/utility/helperFunc");

module.exports = function urlInfo(data_city) {
  // always adding trailing space if not present in url
  let urlObj = {};
  data_city = data_city.toLowerCase();
  if (_.includes(mainCityArr, data_city)) {
    let jdboxkey = data_city + "jdbox";
    let irokey = data_city + "iro";
    let cskey = data_city + "cs";
    let tmekey = data_city + "tme";

    urlObj["jdbox_url"] = config_obj[jdboxkey].replace(/\/?$/, "/");
    urlObj["iro_url"] = config_obj[irokey].replace(/\/?$/, "/");
    urlObj["cs_url"] = config_obj[cskey].replace(/\/?$/, "/");
    urlObj["tme_url"] = config_obj[tmekey].replace(/\/?$/, "/");
  } else {
    let jdboxkey = "remotejdbox";
    let irokey = "remoteiro";
    let cskey =  "remotecs";
    let tmekey =  "remotetme";

    urlObj["jdbox_url"] = config_obj[jdboxkey].replace(/\/?$/, "/");
    urlObj["iro_url"] = config_obj[irokey].replace(/\/?$/, "/");
    urlObj["cs_url"] = config_obj[cskey].replace(/\/?$/, "/");
    urlObj["tme_url"] = config_obj[tmekey].replace(/\/?$/, "/");
  }
  urlObj["mongo_url"] = config_obj["bformMongurl"].replace(/\/?$/, "/");
  urlObj["web_services"] = config_obj["web_services"].replace(/\/?$/, "/");
  urlObj["restaurant_api"] = config_obj["restaurant_api"].replace(/\/?$/, "/");
  urlObj["smsemailapi"] = config_obj["smsemailapi"].replace(/\/?$/, "/");

  return urlObj;
};
