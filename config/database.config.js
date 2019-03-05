const envObj = require('./env.conf.js');
const dbConst = require('./database.const.js');
if (envObj.env == 'dev') {
    //retRemoteIpLocal('');
    module.exports = {
        //mongodevurl: 'mongodb://jd_reseller:jdreseller321@tmedashboard2:27017,tmedashboard4:27017,tmedashboard3:27017/jd_reseller?replicaSet=tmedashboard',
        mongodevurl: 'mongodb://172.29.0.186:27017/jd_reseller',
        mongodevIp: 'mongodb://172.29.0.186:27017',
        mongodevDb: 'jd_reseller',
        local: { 
            mumbai: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL},
            delhi: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            kolkata: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            bangalore: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            chennai: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            pune: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            hyderabad: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            ahmedabad: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            remote: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
        },
        iro: { 
            mumbai: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO},
            delhi: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            kolkata: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            bangalore: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            chennai: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            pune: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            hyderabad: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            ahmedabad: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            remote: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
        },
        tme_jds: { 
            mumbai: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS},
            delhi: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            kolkata: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            bangalore: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            chennai: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            pune: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            hyderabad: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            ahmedabad: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            remote: { host: '172.29.67.213', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
        },
        finance: {
            mumbai: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            delhi: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            kolkata: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            bangalore: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            chennai: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            pune: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            hyderabad: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            ahmedabad: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            remote: { host: '172.29.67.215', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
        },
        idconline: { host: '192.168.6.52', user: dbConst.UNAMEIDC, password: dbConst.PASSIDC, database: dbConst.DBNAMEONLINE1 },
        dnc: { host: '192.168.6.52', user: dbConst.UNAMEIDC, password: dbConst.PASSIDC, database: dbConst.DBNAMEDNC },
        idc : {
            mumbai : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_mumbai'},
            delhi : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_delhi'},
            kolkata : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_kolkata'},
            bangalore : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_bangalore'},
            chennai : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_chennai'},
            pune : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_pune'},
            hyderabad : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_hyderabad'},
            ahmedabad : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_ahmedabad'},
            remote : {host : '192.168.6.52', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_remote_cities'},
        },
        messaging : {
            mumbai : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            delhi : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            kolkata : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            bangalore : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            chennai : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            pune : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            hyderabad : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            ahmedabad : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            remote : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
        }
    }
} else {
    module.exports = {
        mongodevurl: 'mongodb://jd_reseller:jdreseller321@tmedashboard2:27017,tmedashboard4:27017,tmedashboard3:27017/jd_reseller?replicaSet=tmedashboard',
        //mongodevurl: 'mongodb://172.29.0.186:27017/jd_reseller',
        mongodevIp: 'mongodb://172.29.0.186:27017',
        mongodevDb: 'jd_reseller',
        local: {
            mumbai: { host: '172.29.0.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            delhi: { host: '172.29.8.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            kolkata: { host: '172.29.16.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            bangalore: { host: '172.29.26.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            chennai: { host: '172.29.32.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            pune: { host: '172.29.40.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            hyderabad: { host: '172.29.50.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            ahmedabad: { host: '192.168.35.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
            remote: { host: '192.168.17.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMELOCAL },
        },
        iro: {
            mumbai: { host: '172.29.0.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            delhi: { host: '172.29.8.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            kolkata: { host: '172.29.16.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            bangalore: { host: '172.29.26.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            chennai: { host: '172.29.32.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            pune: { host: '172.29.40.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            hyderabad: { host: '172.29.50.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            ahmedabad: { host: '192.168.35.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
            remote: { host: '192.168.17.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEIRO },
        },
        tme_jds: {
            mumbai: { host: '172.29.0.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            delhi: { host: '172.29.8.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            kolkata: { host: '172.29.16.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            bangalore: { host: '172.29.26.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            chennai: { host: '172.29.32.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            pune: { host: '172.29.40.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            hyderabad: { host: '172.29.50.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            ahmedabad: { host: '192.168.35.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
            remote: { host: '192.168.17.171', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMETMEJDS },
        },
        finance: {
            mumbai: { host: '172.29.0.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            delhi: { host: '172.29.8.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            kolkata: { host: '172.29.16.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            bangalore: { host: '172.29.26.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            chennai: { host: '172.29.32.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            pune: { host: '172.29.40.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            hyderabad: { host: '172.29.50.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            ahmedabad: { host: '192.168.35.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
            remote: { host: '192.168.17.161', user: dbConst.UNAMELOCAL, password: dbConst.PASSLOCAL, database: dbConst.DBNAMEFINANCE },
        },
        idconline: { host: '192.168.17.233', user: dbConst.UNAMEIDC, password: dbConst.PASSIDC, database: dbConst.DBNAMEONLINE1 },
        dnc: { host: '192.168.1.233', user: dbConst.UNAMEIDC, password: dbConst.PASSIDC, database: dbConst.DBNAMEDNC },
        idc : {
            mumbai : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_mumbai'},
            delhi : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_delhi'},
            kolkata : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_kolkata'},
            bangalore : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_bangalore'},
            chennai : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_chennai'},
            pune : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_pune'},
            hyderabad : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_hyderabad'},
            ahmedabad : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_ahmedabad'},
            remote : {host : '192.168.17.233', user:dbConst.UNAMEIDC,password:dbConst.PASSIDC,database:'online_regis_remote_cities'},
        },
        messaging : {
            mumbai : {host : '172.29.0.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            delhi : {host : '172.29.8.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            kolkata : {host : '172.29.16.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            bangalore : {host : '172.29.26.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            chennai : {host : '172.29.32.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            pune : {host : '172.29.40.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            hyderabad : {host : '172.29.50.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            ahmedabad : {host : '192.168.35.33', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
            remote : {host : '192.168.6.133', user:dbConst.UNAMELOCAL,password:dbConst.PASSLOCAL,database:'sms_email_sending'},
        }
    }
}

var retRemoteIpLocal =   (city)=> {
    if (envObj.env == 'dev') {
        return '192.168.6.86';
    } else {
        return '192.168.17.171';
    }
}
