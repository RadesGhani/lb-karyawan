'use strict';

module.exports = function(Cuti) {
    let isDelete = false;
    let isDueValid = false;
    let dayMonthValid = false;
    let dataStartDate = false;
    let dataEndDate = false;
    let date, Sdate, Edate, sdate, edate; //instance||currentInstance
    let today = new Date();
    const err = {
        statusCode: "400",
        message: "ERROR : waktu cuti telah jatuh tempo."
    };  //err instance
    const S_err = {
        statusCode: "400",
        message: "ERROR : start_date tidak sesuai."
    };  //err start_date
    const E_err = {
        statusCode: "400",
        message: "ERROR : end_date tidak sesuai."
    };  //err end_date
    const SE_err = {
        statusCode: "400",
        message: "ERROR : start_date dan end_date tidak sinkron."
    };  //err end_date

    //Function untuk cek POST/PUT/DELETE & cek kadaluarsa
    function isDue(ctx){
        console.log(ctx)
        if(typeof ctx.isNewInstance != "undefined" || isDelete){
           date = ctx.instance;
        }else{
           date = ctx.currentInstance;
        }
        console.log(date)
        Sdate = [date.start_date.substr(0,4), date.start_date.substr(5,2) - 1, date.start_date.substr(8,2)];
        Edate = [date.end_date.substr(0,4), date.end_date.substr(5,2) - 1, date.end_date.substr(8,2)]
        sdate = new Date(Sdate[0], Sdate[1], Sdate[2]);
        edate = new Date(Edate[0], Edate[1], Edate[2]);
        console.log("instance :\nstart_date = " + sdate + "\nend_date = " + edate);
        console.log("today : " + today);

        if(sdate > today){
            isDueValid = true;
        }else{
            isDueValid = false;
        }

    }
    //END

    //Function validasi jumlah tanggal dan bulan
    function dayMonth(day, month, year){
        console.log("\ndayMonth : " + day + " " + month + " " + year)
        if(day <= 31 && month == 0){
            dayMonthValid = true;
        }else if(day <= 29 && month == 2 && year%4 == 0){
            dayMonthValid = true;
        }else if(day <= 28 && month == 2 && year%4 != 0){
            dayMonthValid = true;
        }else if(day <= 31 && month == 3){
            dayMonthValid == true;
        }else if(day <= 30 && month == 4){
            dayMonthValid = true;
        }else if(day <= 31 && month == 5){
            dayMonthValid = true;
        }else if(day <= 30 && month == 6){
            dayMonthValid = true;
        }else if(day <= 31 && month == 7){
            dayMonthValid = true;
        }else if(day <= 31 && month == 8){
            dayMonthValid = true;
        }else if(day <= 30 && month == 9){
            dayMonthValid = true;
        }else if(day <= 31 && month == 10){
            dayMonthValid = true;
        }else if(day <= 30 && month == 11){
            dayMonthValid = true;
        }else if(day <= 31 && month == 12){
            dayMonthValid = true;
        }else{
            dayMonthValid = false
        }
    }
    //END

    //operation hook validasi tanggal cuti (DELETE)
    Cuti.observe('before delete', function (ctx, next){
        isDelete = true;
        if(isDueValid != true){
            return Promise.reject(err);
        }else{
            return next();
        }
    })
    //END
    
    //operation hook validasi tanggal cuti (POST/PUT)
    Cuti.observe('before save', function (ctx, next){
        console.log(ctx);
        let xdate, start; //start_date
        let ydate, end; //end-date
        
        isDue(ctx);
        console.log("\nisDueValid = " + isDueValid)
        if(isDueValid != true){
            return Promise.reject(err);
        }
        console.log("\ninput value : ")
        if(typeof ctx.data != "undefined"){
            if(typeof ctx.data.start_date != "undefined"){
                xdate = [ctx.data.start_date.substr(0,4), ctx.data.start_date.substr(5,2) - 1, ctx.data.start_date.substr(8,2)];
                start = new Date(xdate[0], xdate[1], xdate[2]);
                dataStartDate = true;
                console.log('start : ' + start);
            };
            if(typeof ctx.data.end_date != "undefined"){
                ydate = [ctx.data.end_date.substr(0,4), ctx.data.end_date.substr(5,2) - 1, ctx.data.end_date.substr(8,2)];
                end = new Date(ydate[0], ydate[1], ydate[2]);
                dataEndDate = true;
                console.log('end : ' + end);
            };
        }
        
        if(dataStartDate){
            dayMonth(xdate[2], xdate[1], xdate[0])
            if(dayMonthValid == false || today >= start){
                return Promise.reject(S_err)
            }
        }else if(dataEndDate){
            dayMonth(ydate[2], ydate[1], ydate[0])
            if(dayMonthValid == false || today >= end){
                return Promise.reject(E_err)
            }
        }else{
            dayMonth(Sdate[2], Sdate[1], Sdate[0])
            if(dayMonthValid == false){
                return Promise.reject(S_err)
            }
            dayMonth(Edate[2], Edate[1], Edate[0])
            if(dayMonthValid == false){
                return Promise.reject(E_err)
            }
        };

        if(dataStartDate && dataEndDate){
            if(start > end){
                return Promise.reject(SE_err)
            }else{
                return next();
            }
        }else if(dataStartDate){
            if(start > edate){
                return Promise.reject(SE_err)
            }else{
                return next();
            }
        }else if (dataEndDate){
            if(sdate > end){
                return Promise.reject(SE_err)
            }else{
                return next();
            }
        }else{
            if(sdate > edate){
                return Promise.reject(SE_err)
            }else{
                return next();
            }
        };
    })
    //END
};
