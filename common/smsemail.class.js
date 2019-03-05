const ConnCity = require(__basedir + "/config/conncity");
const conf = require(__basedir + "/config/database.config.js");
const dbcon = require(__basedir + "/config/db.js");
const {isEmpty, addslashes, stripslashes} = require(__basedir +
  "/app/utility/helperFunc");
const curlObj = require(__basedir + "/app/utility/curlRequest");
const URLINFO = require(__basedir + "/common/geturl");
class SMSEmailClass {
  async sendSMS(param) {
    let result = {};
    if (isEmpty(param.data_city)) {
      result["error"] = 1;
      result["msg"] = "data_city is blank";
      return result;
    }
    if (isEmpty(param.mobile)) {
      result["error"] = 1;
      result["msg"] = "mobile is blank";
      return result;
    }

    if (isEmpty(param.sms_text)) {
      result["error"] = 1;
      result["msg"] = "sms_text is blank";
      return result;
    }

    if (isEmpty(param.source)) {
      result["error"] = 1;
      result["msg"] = "source is blank";
      return result;
    }
    // Assigning Params

    const data_city = param.data_city;
    const mobile = param.mobile;
    let sms_text = param.sms_text;
    const source = param.source;

    let pid_str = "";
    if (!isEmpty(param.parentid)) {
      let parent_id = param.parentid;
      pid_str = " , parent_id = '" + parent_id + "'";
    }

    let url_info = URLINFO(data_city);
    let conn_city_obj = new ConnCity();
    const conninfo = await conn_city_obj.getConnCity(param);

    if (conninfo.err === 0) {
      const conn_city = conninfo.conn_city;
      const conn_messaging = conf["messaging"][conn_city];

      if (conn_city === "remote") {
        let smsInfo = "";

        let sms_url = url_info["smsemailapi"] + "insert.php";
        let smsdata = {};
        smsdata["data"] = {};
        smsdata["data"]["mod"] = "common_idc";
        if (!isEmpty(param.parentid)) {
          smsdata["data"]["parentid"] = param.parentid;
        }

        smsdata["data"]["mobile"] = mobile;
        smsdata["data"]["sms_text"] = sms_text;
        smsdata["data"]["source"] = source;

        smsInfo = await curlObj.curlCall("xxx", sms_url, smsdata, "post", {});
        if (!isEmpty(smsInfo)) {
          smsInfo = smsInfo.toLowerCase();
          if (smsInfo === "success") {
            result["error"] = 0;
            result["msg"] = "Success";
            return result;
          }
        }
        result["error"] = 1;
        result["msg"] = "Fail";
        return result;
      } else {
        sms_text = addslashes(stripslashes(sms_text));
        const smsSent = await dbcon.db_query({
          conn: conn_messaging,
          query:
            "INSERT INTO tbl_common_intimations SET mobile = '" +
            mobile +
            "', sms_text = '" +
            sms_text +
            "', source = '" +
            source +
            "' " +
            pid_str +
            ""
        });

        if (Object.keys(smsSent).length > 0) {
          result["error"] = 0;
          result["msg"] = "Success";
          return result;
        }
        result["error"] = 1;
        result["msg"] = "Fail";
        return result;
      }
    } else {
      return res
        .status(500)
        .json({error: {code: 1, msg: "Not able to identify conn_city"}});
    }
  }

  async sendEmail(param) {
    let result = {};

    if (isEmpty(param.data_city)) {
      result["error"] = 1;
      result["msg"] = "data_city is blank";
      return result;
    }

    if (isEmpty(param.email_id)) {
      result["error"] = 1;
      result["msg"] = "email_id is blank";
      return result;
    }
    if (isEmpty(param.email_subject)) {
      result["error"] = 1;
      result["msg"] = "email_subject is blank";
      return result;
    }

    if (isEmpty(param.email_text)) {
      result["error"] = 1;
      result["msg"] = "email_text is blank";
      return result;
    }

    if (isEmpty(param.sender_email)) {
      result["error"] = 1;
      result["msg"] = "sender_email is blank";
      return result;
    }

    if (isEmpty(param.source)) {
      result["error"] = 1;
      result["msg"] = "source is blank";
      return result;
    }

    // Assigning Params

    const data_city = param.data_city;
    const email_id = param.email_id;
    const email_subject = param.email_subject;
    let email_text = param.email_text;
    const sender_email = param.sender_email;
    const source = param.source;

    let pid_str = "";
    if (!isEmpty(param.parentid)) {
      let parent_id = param.parentid;
      pid_str = " , parent_id = '" + parent_id + "'";
    }

    let url_info = URLINFO(data_city);
    let conn_city_obj = new ConnCity();
    const conninfo = await conn_city_obj.getConnCity(param);

    if (conninfo.err === 0) {
      const conn_city = conninfo.conn_city;
      const conn_messaging = conf["messaging"][conn_city];

      if (conn_city === "remote") {
        email_text = addslashes(stripslashes(email_text));

        let emailInfo = "";

        let email_url = url_info["smsemailapi"] + "insert.php";
        let emaildata = {};
        emaildata["data"] = {};
        emaildata["data"]["mod"] = "common_idc";
        if (!isEmpty(param.parentid)) {
          emaildata["data"]["parentid"] = param.parentid;
        }

        emaildata["data"]["email_id"] = email_id;
        emaildata["data"]["email_subject"] = email_subject;
        emaildata["data"]["email_text"] = email_text;
        emaildata["data"]["sender_email"] = sender_email;
        emaildata["data"]["source"] = source;

        emailInfo = await curlObj.curlCall(
          "xxx",
          email_url,
          emaildata,
          "post",
          {}
        );
        if (!isEmpty(emailInfo)) {
          emailInfo = emailInfo.toLowerCase();
          if (emailInfo === "success") {
            result["error"] = 0;
            result["msg"] = "Success";
            return result;
          }
        }
        result["error"] = 1;
        result["msg"] = "Fail";
        return result;
      } else {
        email_text = addslashes(stripslashes(email_text));

        const emailSent = await dbcon.db_query({
          conn: conn_messaging,
          query:
            "INSERT INTO tbl_common_intimations SET email_id = '" +
            email_id +
            "', email_subject = '" +
            email_subject +
            "', email_text = '" +
            email_text +
            "', sender_email = '" +
            sender_email +
            "', source = '" +
            source +
            "' " +
            pid_str +
            ""
        });

        if (Object.keys(emailSent).length > 0) {
          result["error"] = 0;
          result["msg"] = "Success";
          return result;
        }
        result["error"] = 1;
        result["msg"] = "Fail";
        return result;
      }
    } else {
      return res
        .status(500)
        .json({error: {code: 1, msg: "Not able to identify conn_city"}});
    }
  }
}
module.exports = SMSEmailClass;
