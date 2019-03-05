const {isEmpty} = require(__basedir + "/app/utility/helperFunc");
var _ = require("lodash");
class ConnCity {
  getConnCity(params) {
    let data_city, remote_zone;
    data_city = !isEmpty(params.data_city) ? params.data_city.toString() : "";
    remote_zone = !isEmpty(params.remote_zone)
      ? parseInt(params.remote_zone)
      : 0;

    const main_cities = [
      "mumbai",
      "delhi",
      "kolkata",
      "bangalore",
      "chennai",
      "pune",
      "hyderabad",
      "ahmedabad"
    ];

    return new Promise((resolve, reject) => {
      if (isEmpty(data_city)) {
        reject({
          err: 1,
          msg: "Data City is blank"
        });
      } else {
        let data_obj = {};
        data_city = data_city.toLowerCase();
        let main_data = _.includes(main_cities, data_city);
        if (main_data === true) {
          resolve({
            err: 0,
            conn_city: data_city,
            remote_flag: 0
          });
        } else {
          resolve({
            err: 0,
            conn_city: "remote",
            remote_flag: 1
          });
        }
      }
    });
  }
}
module.exports = ConnCity;
