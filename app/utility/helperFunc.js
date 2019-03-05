var _ = require("lodash");
exports.generateUUID = () => {
    return new Promise((resolve, reject) => {
        var d = new Date().getTime();

        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        resolve(uuid);
    })
}

exports.mainCityArr = [
  "mumbai",
  "delhi",
  "kolkata",
  "pune",
  "bangalore",
  "hyderabad",
  "ahmedabad",
  "chennai"
];

const isEmpty = value =>
  value === undefined ||
  value === null ||
  (typeof value === "object" && Object.keys(value).length === 0) ||
  (typeof value === "string" && value.trim().length === 0);

exports.isEmpty = isEmpty;

exports.addSlashes = function addSlashes(input) {
  //  let str;
  return (input = input.replace(/'/g, "\\'"));
};

exports.isJSON = function isJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

exports.trimObj = function trimObj(obj) {
  if (!Array.isArray(obj) && typeof obj != "object") return obj;
  return Object.keys(obj).reduce(function(acc, key) {
    if (typeof obj[key] == "string") {
      if (obj[key] !== null && obj[key] !== "") {
        acc[key.trim()] = obj[key].trim();
      } else {
        acc[key.trim()] = obj[key];
      }
    } else {
      acc[key.trim()] = trimObj(obj[key]);
    }
    return acc;
  }, Array.isArray(obj) ? [] : {});
};

exports.validateCategories = function validateCategories(catarr) {
  if (Array.isArray(catarr)) {
    let final_catids_arr = [];
    if (catarr.length > 0) {
      catarr.forEach(function(catid) {
        let final_catid = 0;
        final_catid = catid.replace(/[^0-9]/, "");
        if (parseInt(final_catid) > 0) {
          final_catids_arr.push(final_catid);
        }
      });
      //_.compact - false, null, 0, "", undefined, and NaN removed
      return (final_catids_arr = _.uniq(final_catids_arr));
    }
    return catarr;
  } else {
    return catarr;
  }
};

exports.addslashes = (str) => {
    str = str.replace(/\\/g, '\\\\');
    str = str.replace(/\'/g, '\\\'');
    str = str.replace(/\"/g, '\\"');
    str = str.replace(/\0/g, '\\0');
    return str;
};
 
exports.stripslashes = (str) => {
    str = str.replace(/\\'/g, '\'');
    str = str.replace(/\\"/g, '"');
    str = str.replace(/\\0/g, '\0');
    str = str.replace(/\\\\/g, '\\');
    return str;
};

exports.undefNullEmptyCheck = (obj) => {
  if( typeof obj !== 'undefined' && obj && obj != "" ) {
    return true;
  }else{
    return false;
  }
}
exports.capitalize = str => {
  str = str.toLowerCase();
  return str.replace(/\b\w/g, l => l.toUpperCase());
};
