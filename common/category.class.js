const {isEmpty, isJSON} = require(__basedir + "/app/utility/helperFunc");
const curlObj = require(__basedir + "/app/utility/curlRequest");
const URLINFO = require(__basedir + "/common/geturl");

class CategoryClass {
  async catInfo(param) {
    let cat_result = {};
    if (isEmpty(param.data_city)) {
      cat_result["error"] = 1;
      cat_result["msg"] = "data_city is blank";
      return cat_result;
    }
    if (isEmpty(param.where)) {
      cat_result["error"] = 1;
      cat_result["msg"] = "where condition is blank";
      return cat_result;
    }
    if (!isJSON(param.where)) {
      cat_result["error"] = 1;
      cat_result["msg"] = "Please pass proper where condition";
      return cat_result;
    }
    if (isEmpty(param.module)) {
      cat_result["error"] = 1;
      cat_result["msg"] = "module is blank";
      return cat_result;
    }
    let cat_input = {};
    cat_input["data"] = {};
    cat_input["data"]["where"] = param.where.trim();
    cat_input["data"]["city"] = param.data_city.trim();
    cat_input["data"]["module"] = param.module.trim();
    if (!isEmpty(param.return)) {
      cat_input["data"]["return"] = param.return.trim();
    }
    if (!isEmpty(param.scase)) {
      cat_input["data"]["scase"] = param.scase.trim();
    }
    if (!isEmpty(param.q_type)) {
      cat_input["data"]["q_type"] = param.q_type.trim();
    }
    if (!isEmpty(param.limit)) {
      cat_input["data"]["limit"] = param.limit.trim();
    }
    if (!isEmpty(param.orderby)) {
      cat_input["data"]["orderby"] = param.orderby.trim();
    }

    let data_city_val = param.data_city.trim();
    let url_info = URLINFO(data_city_val);
    let catapi_url = url_info["jdbox_url"] + "services/category_data_api.php";
    let catapi_res = await curlObj.curlCall(
      "xxx",
      catapi_url,
      cat_input,
      "post",
      {}
    );
    let category_data = {};
    if (Object.keys(catapi_res).length > 0) {
      category_data = JSON.parse(catapi_res);
      if (
        category_data["errorcode"] == 0 &&
        category_data["results"].length > 0
      ) {
        cat_result["error"] = 0;
        cat_result["data"] = category_data["results"];
      } else if (category_data["errorcode"] == 2) {
        cat_result["error"] = 2;
        cat_result["msg"] = "No Data Found";
      } else if (category_data["errorcode"] == 1) {
        cat_result["error"] = 1;
        cat_result["msg"] = category_data["msg"];
      }
    }
    if (cat_result.length <= 0) {
      cat_result["error"] = 1;
      cat_result["msg"] = "Not getting response from category API";
    }
    return cat_result;
  }
}

module.exports = CategoryClass;
