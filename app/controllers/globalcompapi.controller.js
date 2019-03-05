
const pluralize = require('pluralize');
const _ = require("lodash");
const moment = require("moment");
const {getPublicSuffix} = require('tldjs');

const curlObj = require(__basedir + "/app/utility/curlRequest");
const ConnCity = require(__basedir + "/config/conncity");
const conf = require(__basedir + "/config/database.config.js"); // configuration variables
const dbcon = require(__basedir + "/config/db.js");
const APIPATH = require(__basedir + "/config/paths.js");
const logger = require(__basedir + "/config/winston");

const {  isEmpty,  isJSON,  trimObj,  addSlashes,  validateCategories   } = require(__basedir + "/app/utility/helperFunc");


class GlobalApi {

    async validateCompData(params_arr){

        this.error_array = {};              this.debug_resp = {};       this.parentid = "";
        this.block = {};                    this.err_msg = [];      this.promptmsg = [];
        this.catchkignore = false;          this.excl_cat_flag = false;     
        this.compname_univ_flag = false;    this.debug = false;

        try{

            if(Object.keys(params_arr).length === 0){
                this.err_msg.push("invalid request");
                this.block.msg=this.err_msg;
                this.error_array.block = this.block;
                return this.error_array;
            }

            let cityValidation = await this.validatecity(params_arr);
            let moduleValidation = await this.validatemodule(params_arr);

            if(!cityValidation){
                this.err_msg.push("city is mandatory and can not be empty/invalid");
                this.block.msg=this.err_msg;
                this.error_array.block = this.block;
                return this.error_array;
            }

            if(!moduleValidation){
                this.err_msg.push("module is mandatory and can not be empty/invalid");
                this.block.msg=this.err_msg;
                this.error_array.block = this.block;
                return this.error_array;
            }

            await this.setServers(params_arr);

            let compname        = params_arr.compname;
            let area            = params_arr.area;
            let pincode         = params_arr.pincode;
            let stdcode         = params_arr.stdcode;
            let year_of_est     = params_arr.year_of_est;
            let helpline_flag   = params_arr.helpline_flag;
            let build_name      = params_arr.building_name;
            let strt            = params_arr.street;
            let format_compname = params_arr.format_compname;
            let lndmrk          = params_arr.landmark;

            this.data_city = params_arr.data_city.trim().toLowerCase();
            this.module = params_arr.module.trim().toLowerCase();

            if(params_arr.parentid !== undefined){
                this.parentid = params_arr.parentid;
            }

            if(params_arr.hasOwnProperty('trace') && params_arr.trace==1){
                this.debug = true;
            }


            if(build_name!=undefined || strt!=undefined || lndmrk!=undefined){
                
                let building_name = ''; let street = ''; let landmark = '';

                if(build_name!=undefined){
                    building_name = build_name;
                }
                if(strt!=undefined){
                    street = strt;
                }
                if(lndmrk!=undefined){
                    landmark = lndmrk;
                }

                await this.addressValidation(building_name,street,landmark);
            }

            if(params_arr.hasOwnProperty('state')){
                let state = params_arr.state.trim();
                if(state.length==0){
                    this.err_msg.push("State is blank");
                }
            }

            if(compname!=undefined){
                if(compname.length>0){
                    let parentid = params_arr.parentid;

                    if(parentid!=undefined){
                        await this.contractExclusionInfo(parentid.trim());
                    }

                    if(!this.compname_univ_flag){               
                        await this.companyNameExclusion(compname);
                    }
                    
                    if(!this.compname_univ_flag){               
                        await this.companyNameValidation(compname);
                    }
                    if(format_compname==1){
                        await this.formatCompanyname(compname);
                    }
                }
            }

            if(area!=undefined){

                if(this.module=='de' || this.module=='cs' || this.module=='tme')
                {   
                    let parentid = params_arr.parentid;
                    if(parentid!=undefined){
                        await this.area_HO_GPO_Validation(area,parentid.trim());
                    }
                }
            }

            if(pincode!=undefined){
                let match_flag  =   pincode.match(/^\d{6}$/g);
                if(match_flag ==null){
                    this.err_msg.push("Pincode should be 6 digit numbers :"+pincode);
                }
            }

            if(this.module=='cs'){

                if(mobile ==undefined && landline ==undefined && tollfree ==undefined){
                    this.err_msg.push("Please enter at least one Mobile/Landline/Tollfree number");
                }
            }

            if(params_arr.hasOwnProperty('othercity_number') && params_arr.othercity_number.length>0)
            {
                let std_num_arr = [];
                let othcity_num_arr = [];
                let othercity_number = params_arr.othercity_number.trim();
                let othercity_number_arr = othercity_number.split("|~|");
                othercity_number_arr = othercity_number_arr.filter(n => n);

                if(othercity_number_arr.length>0){

                    for(var i=0; i<othercity_number_arr.length; i++){

                        let number_str = othercity_number_arr[i];

                        let number_std_arr = number_str.split("-");
                        let other_stdcode  = number_std_arr['0'].trim();
                        let other_number   = number_std_arr['1'].trim();

                        if(other_stdcode!=''){
                            let str_arr    =   other_stdcode.split('');
                            if(str_arr['0']=='0'){
                                other_stdcode = other_stdcode.substr(1);
                            }else{
                                other_stdcode =    other_stdcode;
                            }
                        }

                        let total_length = other_stdcode.length+other_number.length;
                        if(total_length == 10){

                            let landlineno = other_stdcode+other_number;

                            std_num_arr.push(landlineno);
                            othcity_num_arr.push(other_number);
                        }
                    }

                    if(std_num_arr.length>0){

                        let othcity_num_str = othcity_num_arr.join("','");
                        let block_num_other = await this.checkBlockedNum(std_num_arr,othcity_num_str,'O');

                        let blknoStr = block_num_other.toString();

                        if(block_num_other.length>0){

                            this.err_msg.push("These other city numbers cannot be added as its Blocked For Entry :"+blknoStr);
                        }
                    }                    
                }           
            }

            if(params_arr.hasOwnProperty('contact_person') && params_arr.contact_person.length>0)
            {
                let contact_per_str  = params_arr.contact_person;
                let contact_per_arr = contact_per_str.split("|~|");
                contact_per_arr = contact_per_arr.filter(n => n);

                if(contact_per_arr.length>1){
                    let duplicate_Names = await this.duplicateWords(contact_per_arr);

                    let duplicate_Names_str = duplicate_Names.toString();

                    if(duplicate_Names.length>0){
                        this.err_msg.push("Contact person has duplicate value:"+duplicate_Names_str);
                    }
                }

                for(var i=0; i<contact_per_arr.length; i++){

                    let contact_person = contact_per_arr[i];

                    let name_splchar_check = contact_person.match(/[^a-zA-Z\s]/g);
                    if(name_splchar_check!=null){
                        this.err_msg.push("Contact person name should be only Albhabetic :"+contact_person+": -- "+name_splchar_check);
                    }

                    let repeate_check = this.checkContinueRepeatation(contact_person,4);
                    if(repeate_check.length>0){
                        this.err_msg.push("Contact person name contains more than 4 repeated alphabets for :"+contact_person);
                    }

                }
            }

            if(params_arr.hasOwnProperty('designation') && params_arr.designation.length>0){
                let desig_str  = params_arr.designation;
                let desig_arr = desig_str.split("|~|");
                desig_arr = desig_arr.filter(n => n);

                for(var i=0; i<desig_arr.length; i++){

                    let designation = desig_arr[i];

                    let desig_splchar_check = designation.match(/[^a-zA-Z\s]/g);

                    if(desig_splchar_check!=null){
                        this.err_msg.push("Contact person name should be only Albhabetic :"+designation+": -- "+desig_splchar_check);
                    }

                    let repeate_check = this.checkContinueRepeatation(designation,4);
                    if(repeate_check.length>0){
                        this.err_msg.push("Designation contains more than 4 repeated characters :"+designation);
                    }

                }
            }

            if(params_arr.hasOwnProperty('landline') && params_arr.landline.length>0)
            {
                let std_landline_arr = [];
                let landline_num_arr = [];
                let virtual_match_arr = [];
                let landline = params_arr.landline.trim();
                let landline_arr = landline.split("|~|");
                landline_arr = landline_arr.filter(n => n);

                if(landline_arr.length>1){
                    let duplicate_numbers = await this.duplicateWords(landline_arr);

                    let duplicate_numbers_str = duplicate_numbers.toString();

                    if(duplicate_numbers.length>0){
                        this.err_msg.push("Landline numbers has duplicate value:"+duplicate_numbers_str);
                    }
                }

                if(landline_arr.length>0){

                    for(var i=0; i<landline_arr.length; i++){

                        let land_number = landline_arr[i];

                        let numb_check = land_number.match(/[^0-9]/g);
                        if(numb_check!=null){
                            this.err_msg.push("Landline number should be numeric :"+numb_check);
                        }

                        let land_number_str = land_number.split('');
                        if(land_number_str['0']<2 || land_number_str['0']>6){
                            this.err_msg.push("Landline number should be numeric starting from 2-7 :"+land_number);
                        }

                        let sql_check_virtual = "SELECT city FROM tbl_virtual_number_range WHERE city = '"+this.data_city+"'  AND '"+land_number+"' BETWEEN start_number AND end_number";

                        let res_check_virtual = await dbcon.db_query({ conn: this.conn_local, query: sql_check_virtual });

                        if(res_check_virtual.length>0){
                            virtual_match_arr.push(land_number); 
                        }
                        
                        if(stdcode!=undefined){
                            let str_arr    =   stdcode.split('');
                            if(str_arr['0']=='0'){
                                stdcode = stdcode.substr(1);
                            }else{
                                stdcode = stdcode;
                            }

                            let total_length = stdcode.length+land_number.length;
                            if(total_length == 10){

                                let fulllandlineno = stdcode+land_number;
                                std_landline_arr.push(fulllandlineno);
                                landline_num_arr.push(land_number);
                            }
                            else{
                                this.err_msg.push("Lenght of Stdcode and Landline number should be 10 digit  : Stdcode-> :"+stdcode+" landline number-> : "+land_number);
                            }
                        }
                        else
                        {
                            this.err_msg.push("StdCode is mandatory for a valid landline number :"+land_number);
                        }
                    }

                    if(std_landline_arr.length>0){

                        let othcity_num_str = landline_num_arr.join("','");
                        let block_num_other = await this.checkBlockedNum(std_landline_arr,othcity_num_str,'L');

                        let blknoStr = block_num_other.toString();

                        if(block_num_other.length>0){

                            this.err_msg.push("These landline numbers cannot be added as its Blocked For Entry :"+blknoStr);
                        }                
                    }

                    if(virtual_match_arr.length>0){
                        this.err_msg.push("These Landline numbers ("+virtual_match_arr+") is not allowed since same number exist in our virtual number series, Please change number");
                    }
                }           
            }

            if(params_arr.hasOwnProperty('mobile') && params_arr.mobile.length>0)
            {               
                let mobile = params_arr.mobile.trim();
                let mobile_arr = mobile.split("|~|");
                mobile_arr = mobile_arr.filter(n => n);

                if(mobile_arr.length>1){
                    let duplicate_mob = await this.duplicateWords(mobile_arr);

                    let duplicate_mob_str = duplicate_mob.toString();

                    if(duplicate_mob.length>0){
                        this.err_msg.push("Mobile numbers has duplicate value:"+duplicate_mob_str);
                    }
                }

                if(mobile_arr.length>0){

                    for(var i=0; i<mobile_arr.length; i++){

                        let mob_number = mobile_arr[i].trim();

                        if(mob_number.length>0){
                            let mob_check = mob_number.match(/^[6789]\d{9}$/g);
                            if(mob_check==null){
                                this.err_msg.push("Mobile number should be 10 digit starting from 6/7/8/9 : "+mob_number);
                            }
                        }
                    }

                    let mobile_arr_str = mobile_arr.join(",");
                    let block_num_other = await this.checkBlockedNum(mobile_arr,mobile_arr_str,'M');
                    let blknoStr = block_num_other.toString();
                    if(block_num_other.length>0){

                        this.err_msg.push("These mobile numbers cannot be added as its Blocked For Entry :"+blknoStr);
                    }

                    let api_url = APIPATH["virtualnum_check"]+mobile_arr_str;
                    let value = await curlObj.curlCall("xxx", api_url, {}, "get", {});

                    if(!isEmpty(value)){
                        let result = JSON.parse(value);
                        let virtual_num_str = result.virtual_numbers.toString();
                        if(virtual_num_str.length>0){
                            this.err_msg.push("These mobile numbers ("+virtual_num_str+") is not allowed since same number exist in our virtual number series, Please change number");
                        }
                    }

                    if(this.parentid.length>0){
                        await this.five_plus_mobile_check(this.parentid,mobile_arr_str);
                    }

                }
            }

            if(params_arr.hasOwnProperty('tollfree') && params_arr.tollfree.length>0)
            {
                let tfree = params_arr.tollfree.trim();
                let tfree_arr = tfree.split("|~|");

                if(tfree_arr.length>1){
                    let duplicate_tfree = await this.duplicateWords(tfree_arr);

                    let duplicate_tfree_str = duplicate_tfree.toString();

                    if(duplicate_tfree.length>0){
                        this.err_msg.push("Tollfree number has duplicate value : "+duplicate_tfree_str);
                    }
                }

                if(tfree_arr.length>0){

                     for(var i=0; i<tfree_arr.length; i++){

                        let tollfree_number = tfree_arr[i];

                        let tlfree_check = tollfree_number.match(/^(((1800){1})|((1860){1})|((0008){1}))\d{4,9}$/g);

                        if(tlfree_check==null){
                            this.err_msg.push("Tollfree number should be 8-13 digits starting from 1800/0008/1860 : "+tollfree_number);
                        }
                    }
                }
            }

            if(params_arr.hasOwnProperty('fax') && params_arr.fax.length>0)
            {
                let fax = params_arr.fax.trim();
                let fax_arr = fax.split("|~|");

                if(fax_arr.length>1){
                    let duplicate_fax = await this.duplicateWords(fax_arr);

                    let duplicate_fax_str = duplicate_fax.toString();

                    if(duplicate_fax.length>0){
                        this.err_msg.push("Fax number has duplicate value : "+duplicate_fax_str);
                    }
                }

                if(fax_arr.length>0){

                    for(var i=0; i<fax_arr.length; i++){

                        let fax_number = fax_arr[i];


                        if(stdcode!=undefined){
                            let str_arr    =   stdcode.split('');
                            if(str_arr['0']=='0'){
                                stdcode = stdcode.substr(1);
                            }else{
                                stdcode = stdcode;
                            }

                            let total_length = stdcode.length+fax_number.length;
                            if(total_length != 10){
                                this.err_msg.push("Lenght of Stdcode and Fax number should be 10 digit : Stdcode-> :"+stdcode+" Fax number-> : "+fax_number);
                            }
                        }
                    }
                }
            }

            if(params_arr.hasOwnProperty('email') && params_arr.email.length>0)
            {
                let email = params_arr.email.trim();
                let email_arr = email.split("|~|");

                if(email_arr.length>1){
                    let duplicate_email = await this.duplicateWords(email_arr);

                    let duplicate_email_str = duplicate_email.toString();

                    if(duplicate_email.length>0){
                        this.err_msg.push("Email address has duplicate value : "+duplicate_email_str);
                    }
                }

                if(email_arr.length>0){

                    for(var i=0; i<email_arr.length; i++){

                        let email_id = email_arr[i];
                        
                        let email_check = email_id.match(/^[+a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,15}$/g);
                        
                        if(email_check==null){
                            this.err_msg.push("Invalid Email address : "+email_id);
                        }
                    }
                }
            }

            if(params_arr.hasOwnProperty('website') && params_arr.website.length>0)
            {
                let website = params_arr.website.trim();
                let website_arr = website.split("|~|");

                if(website_arr.length>1){
                    let duplicate_web = await this.duplicateWords(website_arr);

                    let duplicate_web_str = duplicate_web.toString();

                    if(duplicate_web.length>0){
                        this.err_msg.push("Website url has duplicate value : "+duplicate_web_str);
                    }
                }

                if(website_arr.length>0){
                    for(var i=0; i<website_arr.length; i++){

                        let website_name = website_arr[i];

                        let web_check1 = website_name.match(/^(([\w]+:)?\/\/)?(([\d\w]|%[a-fA-f\d]{2,2})+(:([\d\w]|%[a-fA-f\d]{2,2})+)?@)?([\d\w][-\d\w]{0,253}[\d\w]\.)+[\w]{2,15}(:[\d]+)?(\/([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)*(\?(&?([-+_~.\d\w]|%[a-fA-f\d]{2,2})=?)*)?(#([-+_~.\d\w]|%[a-fA-f\d]{2,2})*)?$/g);

                        if(web_check1==null){
                            this.err_msg.push("Invalid Website address : "+website_name);
                        }
                        else
                        {
                            let web_check2 = website_name.match(/w{4,}/g);
                            if(web_check2!=null){
                                this.err_msg.push("Invalid Website address : "+website_name);
                            }

                            let firstthree =    website_name.substr(0, 3);
                            if(firstthree.toLowerCase()=='www'){
                                let firstfour =    website_name.substr(0, 4);
                                if(firstfour.toLowerCase()!='www.'){
                                    this.err_msg.push("Website url should contains www. at first position : "+website_name);
                                }
                            }
                            else{
                                this.err_msg.push("Invalid Website address should contains www. at first position : "+website_name);
                            }

                            /*let suffix = getPublicSuffix(website_name);
                            suffix = '.'+suffix;
                            let web_processed =  website_name.replace(suffix,'');
                            web_processed =  web_processed.replace(/(www\.)/,'');

                            if(web_processed.length>63){
                                this.err_msg.push("Website url should not contain more than 63 character exluding .com/.in/www. : "+website_name);
                            }*/
                        }

                        let web_check3 = website_name.match(/https?:\/\//g);
                        if(web_check3!=null){
                            this.err_msg.push("Website url contains http/https : "+website_name);
                        }
                    }
                }
            }

            if(year_of_est!=undefined){
                year_of_est = year_of_est.trim();
                let myDate = new Date(year_of_est);
                let mindate = new Date('1800');
                let today = new Date();

                if ( myDate > today ) { 
                    this.err_msg.push("Year should not be greater than current year");
                } 
                if ( myDate < mindate ) { 
                    this.err_msg.push("Year should be greater than 1800");
                }

                let yoe_check = year_of_est.match(/^\d{4}$/g);
                if(yoe_check==null){
                    this.err_msg.push("Invalid year");
                }
            }
        }
        catch(ex){

            let err = "";
            if (!ex.message) {
                err = ex;
            } else {
                err = ex.stack;
            }

            logger.error("Caught Exception!!!", err);
            this.err_msg.push(err);
        }
            

        if(this.debug){
            console.log(this.debug_resp);
        }

        if(this.err_msg.length>0){
            this.block.msg=this.err_msg;
            this.error_array.block = this.block;
        }

        if(this.promptmsg.length>0){
            this.error_array['prompt'] = this.promptmsg;
        }

        return this.error_array;    
    }

    async formatCompanyname(compname){

        let new_comp_disp = await this.formatCompName(compname); 
        if(new_comp_disp!=''){
            new_comp_disp = new_comp_disp.trim();
        }
        let error_code = 0;        
        
        if(compname != new_comp_disp)
        {   error_code = 1; }
        else{
            error_code = 0;
        }
       
        if(error_code==1){
            this.error_array['format_action'] = {'msg':new_comp_disp};
        }      
    }

    async formatCompName(compname)
    {
        let match = compname.match(/[^A-Za-z0-9()\s]/g);

        if(match!=null){
            return compname;
        }
        else
        {   
            compname = compname.trim();

            var parenthesis_flag = 0; 
			let bracket1 =	compname.match(/[(]/g);
			let bracket2 =	compname.match(/[)]/g);
			if(bracket1 && bracket2){
				parenthesis_flag = 1; 
				compname =	compname.replace(/(\(\s)/g,"(");
				compname =	compname.replace(/(\)\s)/g,")");
				compname =  compname.replace("("," ( ");
                compname =  compname.replace(")"," ) ");                               
			}
            if(compname.length>2)
            {
                let compname_arr = compname.split(' ');

                if(compname_arr.length > 0){                    
                    compname_arr = _.filter(compname_arr,function(num){ 
                        return num != ''; 
                    });
                    let compname_str = await this.addslashesArr(compname_arr).join("','");
                    
                    let sqlCompList = "SELECT word FROM online_regis1.tbl_formatted_company_list WHERE word IN ('"+compname_str+"')"; 

                    let resCompList = await dbcon.db_query({ conn: this.conn_idc, query: sqlCompList });

                    let format_word_arr = [];

                    if(resCompList.length>0){
                    
                        for(var i=0; i<resCompList.length; i++){
                            let db_word = resCompList[i].word;
                            format_word_arr.push(db_word);
                        }
                    }

                    for(var i=0; i<compname_arr.length; i++){

                        let key = compname_arr[i].trim();
                        if(key!=''){
                            if(_.includes(format_word_arr, key.toUpperCase())){
                                compname_arr[i]=key.toUpperCase();
                            }
                            else
                            {
                                let val = '';
                                let match = key.match(/[()]/g);
                                if(match!=null){
                                    val = key;                             
                                }else{
                                    val = _.startCase(_.toLower(key));
                                }
                                compname_arr[i]=val;
                            }
                        }
                    }

                    let formatted_str = compname_arr.join(" ");
                    if(parenthesis_flag == 1 ){
                        formatted_str = formatted_str.replace("( ","(");
                        formatted_str = formatted_str.replace(") ",")");
                        formatted_str = formatted_str.replace(" (","(");
                        formatted_str = formatted_str.replace(" )",")");
                        formatted_str = formatted_str.replace("("," (");
                        formatted_str = formatted_str.replace(")",") ");
                    }
                    return formatted_str;
                    
                }           
            }
            return compname;        
        }       
    }

    async companyNameValidation(compname){

        let comp_st1 = new Date();
        if(this.debug){
            this.debug_resp['COMP - Start Time'] = comp_st1;
        }

        let spec_char_chk = ["'","&","(",")",".","-"];
        
        let compfirst = compname.charAt(0);

        if(spec_char_chk.indexOf(compfirst)>=0){
            this.err_msg.push("Company name starting with special characters");
        }
        
        var compname_ws   =   compname.replace(/\s/,'');    
        var splcharat_end =   compname_ws.match(/[&'().-]{2}$/g);

        if(splcharat_end!=null){
            this.err_msg.push("Company name can not contain more than one special characters at the end.");
        }

        if(compname.length>120){
            this.err_msg.push("Company name is more than 120 characters");
        }

        let numb = compname.match(/\d/g);
        // numb = numb.join("");
        if(numb!=null && numb.length>6){
            this.err_msg.push("Company name contains more than 6 numbers");
        }

        let number_flag = this.repeatedCharValidation(compname);
        if(!number_flag){
            this.err_msg.push("Company name contains more than 4 repeated numbers");
        }

        let match_flag = this.repeatedCharValidation(compname);
        if(!match_flag){
            this.err_msg.push("Company name contains more than 4 repeated characters");
        }

        let str_without_spl = compname.replace(/[^a-z|A-Z|0-9]/g,'');

        if(str_without_spl.length<1){
            this.err_msg.push("Company name is Invalid");
        }else if(str_without_spl.length<3){
            this.err_msg.push("Company name is less than 3 characters");
        }
        
        let match_str =   compname.match(/[^a-zA-Z0-9\s&'@().!-]/g);
        if(match_str!=null){
            this.err_msg.push("Company name contains special characters");
        }

        let match_str1 = compname.match(/www\.|https?/g);
        if(match_str1!=null){
            this.err_msg.push("Company name contains www./http");
        }

        if(this.module!='mep'){
            let match_brand_flag = await this.checkBrandname(compname);
            if(match_brand_flag){
                this.promptmsg.push({'msg':'Company name matches with Brand name'});
            }
        }

        if(this.debug){
            let current_date = moment().format("YYYY-MM-DD HH:mm:ss");
            this.debug_resp['CMP1'] = {'action':"Company Validation Till Brand Name Check",'time':current_date};
        }

        if(!this.catchkignore && !this.excl_cat_flag){

            let cat_match_flag = await this.checkCategoryName(compname);
            if(cat_match_flag){
                this.err_msg.push("Company name matches with Category name");
            }
        }
        
        if(!this.catchkignore && !this.excl_cat_flag){
           
            let cat_syno_match  = await this.checkCatSynonym(compname);
            if(cat_syno_match){
                this.err_msg.push("Company name matches with Category synonym");
            }
        }

        if(this.debug){
            let current_date = moment().format("YYYY-MM-DD HH:mm:ss");
            this.debug_resp['CMP2'] = {'action':"Company Validation Till Category synonym", 'time':current_date};
        }

        if(this.data_city!=undefined) {
            await this.checkProfainWord(compname);
        }

        if(this.debug){
            let current_date = moment().format("YYYY-MM-DD HH:mm:ss");
            this.debug_resp['CMP3'] = {'action':"Company Validation Till Profane words", 'time':current_date};
        }

        let city_match_flag = await this.checkCityName(compname);
        if(city_match_flag){
            this.err_msg.push("Company name matches with City name");
        }
        let state_match_flag = await this.checkStateName(compname);
        if(state_match_flag){
            this.err_msg.push("Company name matches with State name");
        }

        let utfcharCheck = compname.match(/[\x00-\x1F\x80-\xFF]/g);
        if(utfcharCheck!=null){
            this.err_msg.push("Companyname contains Non-UTF characters \r\nkindly re-enter companyname manually");
        }
    }

    async contractExclusionInfo(parentid){

        let pid = '"'+parentid+'"';
        let sql_comp_tag = 'SELECT group_concat(reasonid SEPARATOR ",") as reasonid FROM tbl_contract_bypass_exclusion where parentid = '+pid+' AND reasonid IN(5,6) GROUP BY reasonid';

        let res_comp_tag = await dbcon.db_query({ conn: this.conn_iro, query: sql_comp_tag });

        if(res_comp_tag.length!=0 && res_comp_tag[0].reasonid!=null){

            let reasonid = res_comp_tag[0].reasonid;
            let reasonid_arr = [];
            reasonid_arr = reasonid.split(",");

            if(reasonid_arr.length>0){

                if(reasonid_arr.indexOf('5')>=0){
                    this.catchkignore = true;
                }

                if(reasonid_arr.indexOf('6')>=0){
                    this.compname_univ_flag = true;
                }
            }               
        }
    }

    async companyNameExclusion(compname){

        let cname = '"'+compname+'"';
        let sql_comp_list = "SELECT word FROM online_regis1.tbl_compname_exclusion WHERE word = "+cname+" AND active_flag =1 ";

        let res_comp_list = await dbcon.db_query({ conn: this.conn_idc, query: sql_comp_list });

        if(res_comp_list.length!=0 && res_comp_list[0].word!=null){
             this.compname_univ_flag = true;
        }
    }

    async checkBrandname(compname){
        
        let matched_flag = false;
        let companystr = compname.replace(/[^a-zA-Z0-9\s]/g, ' ');
        companystr = companystr.toLowerCase();

        let sql_brand_name = "SELECT GROUP_CONCAT(brand_name SEPARATOR '|~|') as brand_name, GROUP_CONCAT(source separator '|~|') as source FROM tbl_brand_names WHERE MATCH(brand_name) AGAINST('"+companystr+"' IN BOOLEAN MODE) LIMIT 1";

        let res_brand = await dbcon.db_query({ conn: this.conn_iro, query: sql_brand_name });

        if(res_brand.length>0){

            if(res_brand[0].brand_name!=null){
                let brand_name = res_brand[0].brand_name.trim().toLowerCase();
                if(brand_name!='' | brand_name!=undefined)
                {
                    // let source = res_brand[0].source.trim().toLowerCase();
                    let brand_name_arr = brand_name.split("|~|");
                    // let source_arr = source.split("|~|");

                    for(var i=0; i<brand_name_arr.length; i++){
                        let val = brand_name_arr[i].toLowerCase();
                        if(companystr.indexOf(val)>=0){
                            matched_flag=true
                        }
                    }
                }
            }
        }
        return matched_flag;
    }

    async checkCategoryName(str){

        let match_flag= false;
        let wherecond = '';

        if(str!=''){
            let business_name   = str.trim();
            business_name       = business_name.replace(/\s+/g, ' ');
            let b1              = pluralize.singular(business_name);
            let b1_ws           = b1.replace(' ','');
            
            if(business_name.toLowerCase() == b1.toLowerCase()){
                wherecond = "(category_name = '"+this.stringProcess(business_name)+"' OR catname_search_processed_ws = '"+this.stringProcess(b1_ws)+"' OR catname_search_processed = '"+this.stringProcess(b1)+"') AND miscellaneous_flag&16!=16 LIMIT 1";
            }else{
                wherecond = "(category_name = '"+this.stringProcess(business_name)+"' OR category_name = '"+this.stringProcess(b1)+"' OR catname_search_processed_ws = '"+this.stringProcess(b1_ws)+"' OR catname_search_processed = '"+this.stringProcess(b1)+"') AND miscellaneous_flag&16!=16 LIMIT 1";
            }

            let sql_cat_check = "SELECT category_name FROM tbl_categorymaster_generalinfo WHERE "+wherecond;

            let res_cat_check = await dbcon.db_query({ conn: this.conn_local, query: sql_cat_check });

            if(res_cat_check.length>0){
                match_flag = true;
            }
        }
        return match_flag;
    }

    async checkCatSynonym(compname){

        let cat_syno_match=false;
        if(compname!=''){
            let business_name      = compname.trim();
            business_name      = business_name.replace(/\s+/g, ' ');
            let business_name_ws   = business_name.replace(' ',''); 
            
            let sql_cat_synonym = "SELECT GROUP_CONCAT(national_catid) as national_catid FROM tbl_synonym WHERE (synonym_name = '"+this.stringProcess(business_name)+"' OR synname_search_processed_ws = '"+this.stringProcess(business_name_ws)+"') AND active_flag = 1 LIMIT 1";

            let res_cat_synonym = await dbcon.db_query({ conn: this.conn_local, query: sql_cat_synonym });

            if(res_cat_synonym.length>0 && res_cat_synonym.national_catid!=null){

                let national_catid = res_cat_synonym.national_catid.trim();
                let catsyn_natcatid_arr = national_catid.split(',');

                catsyn_natcatid_arr = _.uniq(catsyn_natcatid_arr);

                let chainout_natcatid_arr = this.getChainOutletsCat(catsyn_natcatid_arr);
                
                let syn_matched_cat_arr = this.array_diff(catsyn_natcatid_arr,chainout_natcatid_arr);

                if(syn_matched_cat_arr.length>0){
                    cat_syno_match = true;
                }

            }
        }
        return cat_syno_match;
    }

    async checkProfainWord(str,field=''){ 

        let badword_url = APIPATH['jdboxurl']+'/services/location_api.php';
        let post_data = {};
        post_data["data"] = {};
        post_data["data"]["rquest"] = "badword_check";
        post_data["data"]["companyname"] = str;
        post_data["data"]["data_city"] = this.data_city;
        post_data["data"]["module"] = this.module;

        if(this.parentid.length>0){
            post_data["data"]["parentid"] = this.parentid;
        }
        
        let res_curl = await curlObj.curlCall("xxx", badword_url, post_data, "post", {Authorization: "Basic " + toString("base64")});

        if(!isEmpty(res_curl)){

            let res_arr = JSON.parse(res_curl);
            if(res_arr['result']['allow_flag']==2){
                let msg = '';
                if(field.length>0)
                    msg = res_arr['result']['msg'].replace('company name',field);
                else
                    msg =   res_arr['result']['msg'];                   

                this.err_msg.push(msg);
            }

            if(res_arr['result']['allow_flag']==1){
                if(field=='' && (this.module=='cs' || this.module=='tme' || this.module=='me' )){
                    this.promptmsg.push({'msg':res_arr['result']['msg']});
                }
            }
        }
    }

    async get_paid_status(parentid){ 

        let contract_type_url = APIPATH['jdboxurl']+'/services/contract_type.php';
        let post_data = {};
        post_data["data"] = {};
        post_data["data"]["rquest"] = "get_contract_type";
        post_data["data"]["parentid"] = parentid;
        post_data["data"]["data_city"] = this.data_city;

        let res_curl = await curlObj.curlCall("xxx", contract_type_url, post_data, "post", {Authorization: "Basic " + toString("base64")});
        let contract_type_info_arr = JSON.parse(res_curl);

        return contract_type_info_arr;
    }

    async five_plus_mobile_check(parentid,mobile_arr_str){ 

        let res_arr = {};
        let five_plus_mobile_arr = [];
        let mobcheck_url = APIPATH['jdboxurl']+'/services/mobile_check.php';
        let post_data = {};
        post_data["data"] = {};
        post_data["data"]["rquest"] = "mobile_employee_check";
        post_data["data"]["data_city"] = this.data_city;
        post_data["data"]["module"] = this.module;
        post_data["data"]["mobile"] = mobile_arr_str;
        post_data["data"]["parentid"] = parentid;

        let res_curl = await curlObj.curlCall("xxx", mobcheck_url, post_data, "post", {Authorization: "Basic " + toString("base64")});

        if(isJSON(res_curl)){
            res_arr = JSON.parse(res_curl);
            if(res_arr!=undefined || res_arr!=null){
                if(res_arr.hasOwnProperty('data')){
                    if(Object.keys(res_arr['data']).length>0){
                        let resdata = res_arr['data'];
                        for(var key in resdata){
                            if(resdata.hasOwnProperty(key)){                        
                                let val = resdata[key]['company_count'];
                                if(val>=5) {
                                    five_plus_mobile_arr.push(key);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if(five_plus_mobile_arr.length>0)
        {
            let five_plus_mobile_str = five_plus_mobile_arr.join(',');

            let paid_status_arr = await this.get_paid_status();

            if(paid_status_arr.length>0){
                if(paid_status_arr['result']['paid'] == '0'){
                    this.promptmsg.push({'msg':'The mobile number '+five_plus_mobile_str+' is present in 5 and more active contracts, this will be updated after moderation.'});
                }
                else{
                    this.promptmsg.push({'msg':'The mobile number '+five_plus_mobile_str+' is present in 5 and more active contracts, this will be reviewed by database team.'});
                }
            }
            else{
                this.promptmsg.push({'msg':'The mobile number '+five_plus_mobile_str+' is present in 5 and more active contracts, this will be updated after moderation.'});
            }
        }
    }
    
    async getChainOutletsCat(nat_catids_arr){

        let chain_outlets_arr = [];

        let nat_catids_str = implode(",",nat_catids_arr);
        sql_chain_outlet_cat = "SELECT GROUP_CONCAT(national_catid) as national_catid FROM d_jds.tbl_categorymaster_generalinfo WHERE national_catid IN ("+nat_catids_str+") AND miscellaneous_flag&16=16 LIMIT 1";

        let row_chain_outlet = await dbcon.db_query({ conn: this.conn_local, query: sql_chain_outlet_cat });

        if(row_chain_outlet.length>0 && row_chain_outlet.national_catid!=null){
            national_catid = row_chain_outlet.national_catid.trim();
            chain_outlets_arr = explode(",",national_catid);
            // chain_outlets_arr = this.array_unique(chain_outlets_arr);
            chain_outlets_arr = _.uniq(chain_outlets_arr);
        }

        return chain_outlets_arr;
    }
    async checkStateName(compname){

        let match_flag = false;
        let sql_state_check = "SELECT state FROM tbl_zone_cities WHERE state='"+this.stringProcess(compname)+"' LIMIT 1";

        let res_state_check = await dbcon.db_query({ conn: this.conn_local, query: sql_state_check });
        console.log(res_state_check);
        console.log(sql_state_check);
        if(res_state_check.length>0){
            match_flag = true;
        }

        return match_flag;
    }
    async checkCityName(compname){

        let city_match_flag = false;
        let sql_city_check = "SELECT ct_name,display_flag FROM d_jds.city_master WHERE ct_name='"+this.stringProcess(compname)+"' AND display_flag=1 ";

        let res_city_check = await dbcon.db_query({ conn: this.conn_local, query: sql_city_check });

        if(res_city_check.length>0){
            city_match_flag = true;
        }

        return city_match_flag;
    }

    async area_HO_GPO_Validation(area,parentid){

        let sql_area_check = "SELECT area FROM tbl_companymaster_generalinfo WHERE parentid='"+parentid+"' LIMIT 1"; 

        let res_area_check = await dbcon.db_query({ conn: this.conn_iro, query: sql_area_check });

        if(res_area_check.length>0 && res_area_check[0].area!=null){

            let db_area = res_area_check[0].area.trim().toLowerCase();

            if(db_area != area.trim().toLowerCase())
            {           
                if(area.match(/( HO| H.O.| GPO| G.P.O.)$/g)!=null)
                {   this.err_msg.push("Area should not be contain GPO/HO : "+area); }
                else if(area.match(/( H O| H. O.| G P O| G. P. O.)$/g)!=null)
                {   this.err_msg.push("Area should not be contain GPO/HO : "+area); }
            }   
        }
    }

    async checkBlockedNum(std_num_arr, othcity_num_str,chekType){

        let sqlBlockedNumber = '';
        let blocked_number_arr = [];

        if(chekType==='M'){
            sqlBlockedNumber = "SELECT blocknumber,TRIM(LEADING 0 FROM stdcode) AS stdcode_final FROM dnc.tbl_blockNumbers WHERE blocknumber IN  ("+othcity_num_str+") AND block_status = '1'";
        }
        else{
            sqlBlockedNumber = "SELECT blocknumber,TRIM(LEADING 0 FROM stdcode) AS stdcode_final FROM dnc.tbl_blockNumbers WHERE blocknumber IN  ('"+othcity_num_str+"') AND block_status = '1'";
        }
        
        let resBlockedNumber = await dbcon.db_query({ conn: this.conn_dnc, query: sqlBlockedNumber });

        if(resBlockedNumber.length>0)
        {
            for(var i=0; i<resBlockedNumber.length; i++){
                let final_blockNum ='';
                let blocknumber = resBlockedNumber[i].blocknumber;
                let stdcode_final = resBlockedNumber[i].stdcode_final;
                if(stdcode_final!=null)
                {   final_blockNum = stdcode_final+blocknumber; }
                else if(blocknumber!=null)
                {   final_blockNum = blocknumber; }

                if(final_blockNum.length>0){
                    if(_.includes(std_num_arr, final_blockNum)){
                        blocked_number_arr.push(blocknumber);
                    }
                }
            }
        }

        return blocked_number_arr;
    }

    async addressValidation(building_name,street,landmark){
        
        let address_length = parseInt(building_name.length)+parseInt(street.length)+parseInt(landmark.length);

        if(address_length === 0){
            this.err_msg.push("Please enter any one from Building/Street name/Landmark.");
        }
        else if(address_length<5){
            this.err_msg.push("Total length of Building,Street,Landmark is less than 5 characters");
        }

        if(address_length>250){
            this.err_msg.push("Total length of Building,Street,Landmark should be less than 250 characters");
        }

        if(building_name.length>0){
            await this.checkaddressFields(building_name,'Building name');
        }

        if(street.length>0){
            await this.checkaddressFields(street,'Street');
        }

        if(landmark.length>0){
            await this.checkaddressFields(landmark,'Landmark');
        }

        if((building_name==street) &&  building_name!='' && street!=''){
            this.err_msg.push("Building name and Street name should not be same");
        }
        else if((landmark==street) && landmark!='' && street!=''){
            this.err_msg.push("Landmark name and Street name should not be same");
        }
        else if((building_name==landmark) && landmark!='' && building_name!=''){
            this.err_msg.push("Building name and Landmark name should not be same");
        }
    }

    async checkaddressFields(str,fld){
        let bldg_wt_spl =   str.replace(/[^a-zA-Z0-9]/,'');
        if(bldg_wt_spl==null){
            this.err_msg.push(fld+"contains only special characters");
        }

        let repeate_check = this.checkContinueRepeatation(str,4);
        if(repeate_check.length>0){
            this.err_msg.push(fld+"contains more than 4 repeated alphabets");
        }

        let match_flag = str.match(/([^A-Za-z])(\1{6,})/g);
        if(match_flag){
            this.err_msg.push(fld+"contains more than 6 repeated digits");
        }

        if(fld == 'Street'){

            if(str.length<4){
                this.err_msg.push(fld+" name should not be less than 4 Characters.");
            }

            let strmatch_flag = str.match(/[^a-zA-Z0-9\s]/g);
            if(strmatch_flag!=null){
                if(strmatch_flag.length>4){
                    this.err_msg.push(fld+" name should not contains more than 4 special characters");
                }
            }
        }
        
        await this.checkProfainWord(str,fld);
    }

    repeatedCharValidation(compname){

        let numb = compname.match(/\d/g);
        
        // numb = numb.join("");
        if((numb!=null) && (numb.length >0 )){
            numb = numb.toString();
            for(var i=0; i<numb.length; i++)
            {   
                let val = numb[i];
                let argRegEx = new RegExp(val, 'g');
                let count = (numb.match(argRegEx) || []).length;

                if(count>4){
                    return false;
                }
            }
        }
            
        return true;
    }

    duplicateWords(names){

        const count = names => names.reduce((a, b) =>  Object.assign(a, {[b]: (a[b] || 0) + 1}), {})

        const duplicates = dict => Object.keys(dict).filter((a) => dict[a] > 1)

        return duplicates(count(names));
    }

    checkContinueRepeatation (str,countcheck=1) {
        str = str.trim();
        var output = [];
        var count = 0;
        if(str.length>0){
            str=str.trim();
            for (var i = 0; i < str.length; i++) {
                count++;
                if (str[i] != str[i+1]) {
                    let set = {};
                    let char = str[i];
                    if(count>=countcheck){
                        set[char] = count;
                        output.push(set);
                    }
                    count = 0;
                }
            }
        }
      return output;
    }

    validatecity(param){

        if(param.hasOwnProperty('data_city'))
        {   
            let city = param.data_city.trim().toLowerCase();
            if(city.length == 0)
            {   return false;   }
        }
        else
        {   return false;   }

        return true;
    }

    validatemodule(param){

        if(param.hasOwnProperty('module'))
        {   
            let mastermod = {'me':1,'jda':1,'tme':1};

            let mod = param.module.trim().toLowerCase();
            if(isEmpty(mod))
            {   return false;   }

            if(!mastermod.hasOwnProperty(mod))
            {   return false;   }
        }
        else
        {   return false;   }

        return true;
    }

    stringProcess(str){
        let res = str.replace(new RegExp("\\\\", "g"), "");
        let compstr = res.replace(/'/g, "\\'");
        return compstr;
    }

    array_diff(arr1){
        let retArr = [];
        let argl = arguments.length;
        let k1 = '';
        let i = 1;
        let k = '';
        let arr = {};

        arr1keys: for (k1 in arr1) { 
            for (i = 1; i < argl; i++) {
                arr = arguments[i]
                for (k in arr) {
                    if (arr[k] === arr1[k1]) {
                      continue arr1keys;
                    }
                }
            retArr.push(arr1[k1]);
            }
        }

        return retArr
    }

    addslashesArr(resultArray)
    {
        let result_arr = [];
        for(var i=0; i<resultArray.length; i++)
        {
            let val = resultArray[i];
            let res = val.replace(new RegExp("\\\\", "g"), "");
            let compstr = res.replace(/'/g, "\\'");

            result_arr.push(compstr);
        }
        
        return result_arr;
    }

    async setServers(reqbody){

        let conn_city_obj = new ConnCity();

        const conninfo = await conn_city_obj.getConnCity(reqbody);

        if (conninfo.err === 0) {
            const conn_city = conninfo.conn_city;

            this.conn_iro   = conf["iro"][conn_city];
            this.conn_local = conf["local"][conn_city];
            this.conn_idc   = conf["idc"][conn_city];
            this.conn_dnc   = conf["dnc"];
        }
    }
}

module.exports = GlobalApi;
