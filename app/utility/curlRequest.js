var request = require('request');

exports.curlCall = (type, url, data,method,headObj,curlTimeOut) => {
    var defaultCurlTimeOut = 8000;
    return new Promise((resolve, reject) => {
        if(method == 'post') {
            if(type == 'multipart') {
                var r = request.post(url, {timeout:defaultCurlTimeOut}, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        return reject(err);
                    } else {
                        resolve(body);
                    }
                });
                var form = r.form();
                for (var keyAttach in data.attachments) {
                    form.append('fileData[]', data.attachments[keyAttach]);
                }
                for (var keyData in data.data) {
                    form.append(keyData, data.data[keyData]);
                }
            } else if (type == 'xxx') {                
                if( typeof curlTimeOut !== 'undefined') {
                    if(typeof curlTimeOut.timeout !== 'undefined' && curlTimeOut.timeout != "") {
                        defaultCurlTimeOut = curlTimeOut.timeout;
                    }
                }
                var r = request.post(url,{form:data.data,timeout: defaultCurlTimeOut}, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        let newErr = "CURL Request failed for "+url;
                        console.log(newErr);

                        return reject(newErr);
                    } else {
                        resolve(body);
                    }
                });
            }
        } else if(method=='get') {
            var r = request.get(url, {timeout:defaultCurlTimeOut}, function (err, httpResponse, body) {
                if (err) {
                    return reject(err);
                } else {
                    resolve(body);
                }
            });
        } else if(method='json') {
            var jsonString = JSON.stringify(data);
            var attachedHead    =   {};
            if(Object.keys(headObj).length > 0) {
                attachedHead    =   { 'Content-Type': 'application/json', 'Content-Length': jsonString.length,'HR-API-AUTH-TOKEN':headObj['auth_token']};
            } else {
                attachedHead    =   { 'Content-Type': 'application/json', 'Content-Length': jsonString.length};
            }
            var r = request.post({ url: url, form: jsonString, headers: attachedHead, timeout:defaultCurlTimeOut}, function (err, httpResponse, body) {
                if (err) {
                    return reject(err);
                } else {
                    /* setTimeout(function(){
                        resolve(body)
                    },8000); */
                    resolve(body);
                }
            });
        }
    })
}
