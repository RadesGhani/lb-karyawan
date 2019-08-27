'use strict';

module.exports = function(Cuti) {

    //Logika validasi tanggal cuti
    Cuti.observe('before save', function checkDate(ctx, next){
        let sYear,sMonth,sDay,eYear,eMonth,eDay;
        let dateNow = new Date();
        const sErr = {
            statusCode: "400",
            message: "ERROR : INVALID START_DATE"
        };
        const eErr = {
            statusCode: "400",
            message: "ERROR : INVALID END_DATE"
        };
        const gErr = {
            statusCode: "400",
            message: "ERROR : MISSING START_DATE AND END_DATE PROPERTY"
        };
        let sdpass = false;
        if(ctx.data.start_date && ctx.data.end_date){
            sYear  = ctx.data.start_date.substr(0,4);
            sMonth = ctx.data.start_date.substr(5,2);
            sDay = ctx.data.start_date.substr(8,2);
            let sd = new Date(sYear,sMonth,sDay);
            console.log("today : " + dateNow)
            console.log("start_date : " + sYear + "-" + sMonth + "-" + sDay)
            
            //start_date condition
            if( sd >= dateNow){
                if(sMonth == 1 && sDay <= 31){
                    sdpass = true;
                }else if(sYear%4 == 0 && sMonth == 2 && sDay <= 29){
                    sdpass = true;
                }else if(sYear%4 != 0 && sMonth == 2 && sDay <= 28){
                    sdpass = true;
                }else if(sMonth == 3 && sDay <=31){
                    sdpass = true;
                }else if(sMonth == 4 && sDay <=30){
                    sdpass = true;
                }else if(sMonth == 5 && sDay <=31){
                    sdpass = true;
                }else if(sMonth == 6 && sDay <=30){
                    sdpass = true;
                }else if(sMonth == 7 && sDay <=31){
                    sdpass = true;
                }else if(sMonth == 8 && sDay <=31){
                    sdpass = true;
                }else if(sMonth == 9 && sDay <=30){
                    sdpass = true;
                }else if(sMonth == 10 && sDay <=31){
                    sdpass = true;
                }else if(sMonth == 11 && sDay <=30){
                    sdpass = true;
                }else if(sMonth == 12 && sDay <=31){
                    sdpass = true;
                }else{
                    return Promise.reject(sErr);
                }
            }else{
                console.log('START DATE INVALID, FAILED');
                return Promise.reject(sErr);
            };
            
            //end_date condition
            if(sdpass == true && new Date(eYear,eMonth,eDay) >= sd ){
                eYear = ctx.data.end_date.substr(0,4);
                eMonth = ctx.data.end_date.substr(5,2);
                eDay = ctx.data.end_date.substr(8,2);
                console.log('SUCCESS')
                return next();
            }else{
                console.log('END DATE INVALID, FAILED');
                return Promise.reject(eErr);
            }
        }else{
            return Promise.reject(gErr)
        };
    })
};
