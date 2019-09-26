'use strict';

var app = require('../../server/server');

module.exports = function(Cuti) {

    Cuti.validatesInclusionOf('tipe_cuti', {in: ['reg-first', 'bonus-first']});

    let isDelete = false;
    let isDueValid = false;
    let dayMonthValid = false;
    let dataStartDate = false;
    let dataEndDate = false;
    let date, Sdate, Edate, sdate, edate; //instance||currentInstance
    let today = new Date();
    today.setDate(today.getDate() - 1);today.setHours(23);today.setMinutes(59);today.setSeconds(59);
    const err = {
        statusCode: "400",
        message: "ERROR : waktu cuti telah jatuh tempo."
    };  //err instance
    const S_err = {
        statusCode: "400",
        message: "ERROR : mulai_cuti tidak sesuai."
    };  //err mulai_cuti
    const E_err = {
        statusCode: "400",
        message: "ERROR : selesai_cuti tidak sesuai."
    };  //err selesai_cuti
    const SE_err = {
        statusCode: "400",
        message: "ERROR : mulai_cuti dan selesai_cuti tidak sinkron."
    };  //err selesai_cuti

    //Function untuk cek POST/PUT/DELETE & cek kadaluarsa
    function isDue(ctx){
        if(typeof ctx.isNewInstance != "undefined" || isDelete == true){
           date = ctx.instance;
        }else{
           date = ctx.currentInstance;
        }
        Sdate = [date.mulai_cuti.substr(0,4), date.mulai_cuti.substr(5,2) - 1, date.mulai_cuti.substr(8,2)];
        Edate = [date.selesai_cuti.substr(0,4), date.selesai_cuti.substr(5,2) - 1, date.selesai_cuti.substr(8,2)]
        sdate = new Date(Sdate[0], Sdate[1], Sdate[2]);
        edate = new Date(Edate[0], Edate[1], Edate[2]);
        //console.log("instance :\nmulai_cuti = " + sdate + "\nselesai_cuti = " + edate);
        //console.log("today : " + today);

        if(sdate >= today){
            isDueValid = true;
        }else{
            isDueValid = false;
        }
    }
    //END

    //Function validasi jumlah tanggal dan bulan
    function dayMonth(day, month, year){
        //console.log("\ndayMonth : " + day + " " + month + " " + year)
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
    
    //operation hook validasi tanggal cuti (POST/PUT)
    Cuti.observe('before save', function (ctx, next){
        let xdate, start; //mulai_cuti
        let ydate, end; //end-date
        
        isDue(ctx);
        //console.log("\nisDueValid = " + isDueValid)
        if(isDueValid != true){
            return Promise.reject(err);
        }
        //console.log("\ninput value : ")
        if(typeof ctx.data != "undefined"){
            if(typeof ctx.data.mulai_cuti != "undefined"){
                xdate = [ctx.data.mulai_cuti.substr(0,4), ctx.data.mulai_cuti.substr(5,2) - 1, ctx.data.mulai_cuti.substr(8,2)];
                start = new Date(xdate[0], xdate[1], xdate[2]);
                dataStartDate = true;
                //console.log('start : ' + start);
            };
            if(typeof ctx.data.selesai_cuti != "undefined"){
                ydate = [ctx.data.selesai_cuti.substr(0,4), ctx.data.selesai_cuti.substr(5,2) - 1, ctx.data.selesai_cuti.substr(8,2)];
                end = new Date(ydate[0], ydate[1], ydate[2]);
                dataEndDate = true;
                //console.log('end : ' + end);
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

    //Refund saldo cuti ketika membatalkan cuti
    Cuti.observe('before delete',async (context, err) =>{
        isDelete = true;
        isDue(context);
        console.log(isDueValid);
        if(isDueValid != true){
            throw (err);
        }
        console.log(context.instance);
        console.log(context.instance.id_pengguna)
        const docs = await app.models.saldo_cuti.find({where:{id_pengguna : context.instance.id_pengguna}});
        console.log(docs)

        app.models.saldo_cuti.replaceById(docs[0].id, {
            id : docs[0].id, id_pengguna : docs[0].id_pengguna, cuti_reguler : context.instance.saldo_reg_awal, 
            cuti_bonus : context.instance.saldo_bonus_awal, cuti_bonus_exp : docs[0].cuti_bonus_exp, tanggal_masuk : docs[0].tanggal_masuk}
            ,function(err){
              if (err){
                throw (err);
              } 
              return;
        })
    })

    /*app.models.saldo_cuti.replaceById(id_after, {id : id_after, id_pengguna : penggunaid, cuti_reguler : reg_after, cuti_bonus : bonus_after, cuti_bonus_exp : exp_after, tanggal_masuk : tgl_masuk_after}
        ,function(err){
          if (err){
            app.models.cuti.destroyById(id_cuti)
            throw (err);
          } 
          return next();
    })*/
};
