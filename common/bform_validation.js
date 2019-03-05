const {isEmpty} = require(__basedir + "/app/utility/helperFunc");

module.exports = function validateBformInput(data) {
  let errors = "";

  data.parentid = !isEmpty(data.parentid) ? data.parentid.toString() : "";
  data.noparentid = !isEmpty(data.noparentid) ? data.noparentid.toString() : "";
  data.data_city = !isEmpty(data.data_city) ? data.data_city.toString() : "";
  data.module = !isEmpty(data.module) ? data.module.toString() : "";
  data.ucode = !isEmpty(data.ucode) ? data.ucode.toString() : "";
  data.uname = !isEmpty(data.uname) ? data.uname.toString() : "";

  let tmp_arr = [];
  if (isEmpty(data.parentid) && data.noparentid != "1") {
    tmp_arr.push("Parentid");
  }
  if (isEmpty(data.data_city)) {
    tmp_arr.push("Data City");
  }

  if (isEmpty(data.module)) {
    tmp_arr.push("Module");
  }

  if (isEmpty(data.ucode)) {
    tmp_arr.push("Ucode");
  }

  if (isEmpty(data.uname)) {
    tmp_arr.push("Uname");
  }
  if (tmp_arr.length > 0) {
    errors = tmp_arr.join(", ");
    errors += " is blank.";
  }
  return {
    errors,
    isValid: isEmpty(errors)
  };
};
