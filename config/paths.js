const envObj = require('./env.conf.js');
if(envObj.env == 'dev') {
    module.exports = {
        imageuploadapi: "http://imageupload_staging.justdial.com:100/common_upload/upload.php",
        smsapi: "http://192.168.20.116/SmsEmailComposeInsert.php",
        mumbaiiro: "http://172.29.0.227",
        delhiiro: "http://172.29.0.227",
        kolkatairo: "http://172.29.0.227",
        bangaloreiro: "http://172.29.0.227",
        chennaiiro: "http://172.29.0.227",
        puneiro: "http://172.29.0.227",
        hyderabadiro: "http://172.29.0.227",
        ahmedabadiro: "http://172.29.0.227",
        remoteiro: "http://192.168.17.227",
        mumbaijdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        delhijdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        kolkatajdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        bangalorejdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        chennaijdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        punejdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        hyderabadjdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        ahmedabadjdbox: "http://imteyazraja.jdsoftware.com/jdbox",
        remotejdbox: "http://imteyazraja.jdsoftware.com/jdbox",
	mumbaics: "http://imteyazraja.jdsoftware.com/csgenio",
    	delhics: "http://imteyazraja.jdsoftware.com/csgenio",
    	kolkatacs: "http://imteyazraja.jdsoftware.com/csgenio",
    	bangalorecs: "http://imteyazraja.jdsoftware.com/csgenio",
    	chennaics: "http://imteyazraja.jdsoftware.com/csgenio",
    	punecs: "http://imteyazraja.jdsoftware.com/csgenio",
    	hyderabadcs: "http://imteyazraja.jdsoftware.com/csgenio",
    	ahmedabadcs: "http://imteyazraja.jdsoftware.com/csgenio",
    	remotecs: "http://imteyazraja.jdsoftware.com/csgenio",
    	mumbaitme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	delhitme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	kolkatatme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	bangaloretme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	chennaitme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	punetme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	hyderabadtme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	ahmedabadtme: "http://imteyazraja.jdsoftware.com/tmegenio",
    	remotetme: "http://imteyazraja.jdsoftware.com/tmegenio",
        meservices: "http://apoorva.jdsoftware.com/megenio/me_services",
        jdboxurl: "http://imteyazraja.jdsoftware.com/jdbox",
        paymentapi: "http://palakpatel.jdsoftware.com/web_services/payment_services/insert_vertical_info.php",
        paymentred:"https://beta3.justdial.com:875/new_pg/",
        ssoapiurl:"http://tejasnikam.jdsoftware.com/SSO_SERVICES/",
        ssoapiurlalternate : "http://192.168.12.163:8888/",
        genioliteurl: "http://project02.sumeshdubey.26.blrsoftware.com/GENIO_LITE/genio_lite",
        matchNumberapi: "http://172.29.0.197:1801/",
        selfpath: "http://172.29.86.26:8081",
        bformMongurl:"http://172.29.86.26:5050/",
	web_services: "http://sunnyshende.jdsoftware.com/web_services/web_services",
	restaurant_api:"http://abhinandanladage.jdsoftware.com/restaurantapis/restaurant",
	virtualnum_check: "http://192.168.12.138:81/scripts/check_virtual.php?nos=",
		mumbaiTmeNode   :"http://172.29.64.64:5100/jdboxNode",
        delhiTmeNode    :"http://172.29.64.64:5100/jdboxNode",
        kolkataTmeNode  :"http://172.29.64.64:5100/jdboxNode",
        bangaloreTmeNode:"http://172.29.64.64:5100/jdboxNode",
        chennaiTmeNode  :"http://172.29.64.64:5100/jdboxNode",
        puneTmeNode     :"http://172.29.64.64:5100/jdboxNode",
        hyderabadTmeNode:"http://172.29.64.64:5100/jdboxNode",
        ahmedabadTmeNode:"http://172.29.64.64:5100/jdboxNode",
        remoteTmeNode:"http://172.29.64.64:5100/jdboxNode",
        MAIN_TAB_API:"http://172.29.86.26:4000",
        smsemailapi:"http://192.168.20.116",
        RATINGS_API_URL:"http://192.168.20.11/functions/reviews_initial.php"
    }
} else {
    module.exports = {
        imageuploadapi: "http://imageupload_staging.justdial.com:100/common_upload/upload.php",
        smsapi: "http://192.168.20.116/SmsEmailComposeInsert.php",
        mumbaiiro: "http://172.29.0.227",
        delhiiro: "http://172.29.0.227",
        kolkatairo: "http://172.29.0.227",
        bangaloreiro: "http://172.29.0.227",
        chennaiiro: "http://172.29.0.227",
        puneiro: "http://172.29.0.227",
        hyderabadiro: "http://172.29.0.227",
        ahmedabadiro: "http://172.29.0.227",
        remoteiro: "http://192.168.17.227",
        mumbaijdbox: "http://172.29.0.237:977",
        delhijdbox: "http://172.29.8.237:977",
        kolkatajdbox: "http://172.29.16.237:977",
        bangalorejdbox: "http://172.29.26.237:977",
        chennaijdbox: "http://172.29.32.237:977",
        punejdbox: "http://172.29.40.237:977",
        hyderabadjdbox: "http://172.29.50.237:977",
        ahmedabadjdbox: "http://192.168.35.237:977",
        remotejdbox: "http://192.168.20.135:811",
	mumbaics: "http://172.29.0.217:81",
    	delhics: "http://172.29.8.217:81",
    	kolkatacs: "http://172.29.16.217:81",
    	bangalorecs: "http://172.29.26.217:81",
    	chennaics: "http://172.29.32.217:81",
    	punecs: "http://172.29.40.217:81",
    	hyderabadcs: "http://172.29.50.217:81",
    	ahmedabadcs: "http://192.168.35.217:81",
    	remotecs: "http://192.168.17.217:81",
    	mumbaitme: "http://172.29.0.237:97",
    	delhitme: "http://172.29.8.237:97",
    	kolkatatme: "http://172.29.16.237:97",
    	bangaloretme: "http://172.29.26.237:97",
    	chennaitme: "http://172.29.32.237:97",
    	punetme: "http://172.29.40.237:97",
    	hyderabadtme: "http://172.29.50.237:97",
    	ahmedabadtme: "http://192.168.35.237:97",
    	remotetme: "http://192.168.17.237:197",
        meservices: "http://192.168.20.17/me_services",
        jdboxurl: "http://192.168.20.17:800",
        paymentapi: "http://192.168.20.102:9001/payment_services/insert_vertical_info.php",
        paymentred:"https://securepg.justdial.com/",
        ssoapiurl: "http://192.168.20.237:8080/",
        ssoapiurlalternate : "http://192.168.12.163:8888/",
        genioliteurl: "http://103.20.126.35:9100/genio_lite",
        matchNumberapi: "http://172.29.0.197:1801/",
        selfpath: "http://103.20.126.35:9100",
        bformMongurl:"http://192.168.20.111:8888/",
	web_services: "http://192.168.20.102:9001/web_services",
	restaurant_api: "http://192.168.20.109/restaurantapis/restaurant",
	virtualnum_check: "http://192.168.12.138:81/scripts/check_virtual.php?nos=",
		mumbaiTmeNode:"http://172.29.0.237:8082/jdboxNode",
        delhiTmeNode:"http://172.29.8.237:8082/jdboxNode",
        kolkataTmeNode:"http://172.29.16.237:8082/jdboxNode",
        bangaloreTmeNode:"http://172.29.26.237:8082/jdboxNode",
        chennaiTmeNode:"http://172.29.32.237:8082/jdboxNode",
        puneTmeNode:"http://172.29.40.237:8082/jdboxNode",
        hyderabadTmeNode:"http://172.29.50.237:8082/jdboxNode",
        ahmedabadTmeNode:"http://192.168.35.237:8082/jdboxNode",
        remoteTmeNode:"http://192.168.17.237:8082/jdboxNode",        
        MAIN_TAB_API:"http://192.168.20.133",
        smsemailapi:"http://192.168.20.116",
        RATINGS_API_URL:"http://192.168.20.11/functions/reviews_initial.php"
    }
}

//103.20.126.35
//103.20.126.124
//MAIN_TAB_API:"http://192.168.20.133"
