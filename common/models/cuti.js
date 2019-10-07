'use strict';

module.exports = function(Cuti) {
    
    Cuti.validatesInclusionOf('tipe_cuti', {in: ['reg-first', 'bonus-first']});
    
    let isApproval = false;
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
        //console.log(ctx.instance.mulai_cuti)
        if(typeof ctx.isNewInstance != "undefined" || isDelete){
           date = ctx.instance;
        }else{
           date = ctx.currentInstance;
        }
        //console.log(date.mulai_cuti)
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
        if (isApproval == true) return next();
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

    {
        let docs
        Cuti.remoteMethod(
            'ttdKetua',
            {
              accepts: [{arg: 'id_cuti', type: 'string', required: 'true'},{arg: 'persetujuan', type: "boolean", required: 'true'}],
              http: {path: '/:id/ttdKetua', verb: 'post'},
              returns: {arg: 'status', type: 'object'}
            }
        )

        Cuti.ttdKetua = function(id_cuti, persetujuan, cb){
            const error = {
                statusCode: "400",
                message: "ERROR : Id cuti tidak ditemukan."
            }
            if (typeof docs[0] == "undefined"){
                return Promise.reject(error)
            }
            isApproval = true
            docs[0].tgl_pengajuan = docs[0].tgl_pengajuan.toLocaleString()
            docs[0].mulai_cuti = docs[0].mulai_cuti.toLocaleString()
            docs[0].selesai_cuti = docs[0].selesai_cuti.toLocaleString()
            Cuti.upsertWithWhere({id:id_cuti},{
                id:id_cuti, nama:docs[0].nama, tgl_pengajuan:docs[0].tgl_pengajuan,
                mulai_cuti: docs[0].mulai_cuti, selesai_cuti:docs[0].selesai_cuti, keperluan:docs[0].keperluan,
                tugas_selesai1: docs[0].tugas_selesai1, tugas_selesai2: docs[0].tugas_selesai2, tugas_berjalan1: docs[0].tugas_berjalan1,
                tugas_berjalan2: docs[0].tugas_berjalan2, tugas_berjalan3: docs[0].tugas_berjalan3, alih_tangan: docs[0].alih_tangan,
                tugas_alihan1: docs[0].tugas_alihan1, tugas_alihan2: docs[0].tugas_alihan2, saldo_reg_awal: docs[0].saldo_reg_awal,
                saldo_reg_akhir: docs[0].saldo_reg_akhir, saldo_bonus_awal: docs[0].saldo_bonus_awal, saldo_bonus_akhir: docs[0].saldo_bonus_akhir,
                tipe_cuti: docs[0].tipe_cuti, ttd_ketua: persetujuan, ttd_hrd: docs[0].ttd_hrd, id_pengguna: docs[0].id_pengguna,
            },function(){
                cb(null, "BERHASIL")
            })
        }
        
        Cuti.beforeRemote('ttdKetua', async(context)=>{
            try{
                docs = await(Cuti.find({where:{id:context.args.id_cuti}}))
                return
            }catch(err){
                if (err) throw err
            }
        })

        {
            let docs
            Cuti.remoteMethod(
                'ttdHRD',
                {
                  accepts: [{arg: 'id_cuti', type: 'string', required: 'true'},{arg: 'persetujuan', type: "boolean", required: 'true'}],
                  http: {path: '/:id/ttdHRD', verb: 'post'},
                  returns: {arg: 'status', type: 'object'}
                }
            )
    
            Cuti.ttdHRD = function(id_cuti, persetujuan, cb){
                const error = [{
                    statusCode: "400",
                    message: "ERROR : Id cuti tidak ditemukan."
                },
                {
                    statusCode: "400",
                    message: "ERROR : Belum ada persetujuan dari ketua tim."
                }
                ]
                if (typeof docs[0] == "undefined") return Promise.reject(error[0])
                if (docs[0].ttd_ketua == false || docs[0].ttd_ketua == undefined) return Promise.reject(error[1])
                isApproval = true
                docs[0].tgl_pengajuan = docs[0].tgl_pengajuan.toLocaleString()
                docs[0].mulai_cuti = docs[0].mulai_cuti.toLocaleString()
                docs[0].selesai_cuti = docs[0].selesai_cuti.toLocaleString()
                Cuti.upsertWithWhere({id:id_cuti},{
                    id:id_cuti, nama:docs[0].nama, tgl_pengajuan:docs[0].tgl_pengajuan,
                    mulai_cuti: docs[0].mulai_cuti, selesai_cuti:docs[0].selesai_cuti, keperluan:docs[0].keperluan,
                    tugas_selesai1: docs[0].tugas_selesai1, tugas_selesai2: docs[0].tugas_selesai2, tugas_berjalan1: docs[0].tugas_berjalan1,
                    tugas_berjalan2: docs[0].tugas_berjalan2, tugas_berjalan3: docs[0].tugas_berjalan3, alih_tangan: docs[0].alih_tangan,
                    tugas_alihan1: docs[0].tugas_alihan1, tugas_alihan2: docs[0].tugas_alihan2, saldo_reg_awal: docs[0].saldo_reg_awal,
                    saldo_reg_akhir: docs[0].saldo_reg_akhir, saldo_bonus_awal: docs[0].saldo_bonus_awal, saldo_bonus_akhir: docs[0].saldo_bonus_akhir,
                    tipe_cuti: docs[0].tipe_cuti, ttd_ketua: docs[0].ttd_ketua, ttd_hrd: persetujuan, id_pengguna: docs[0].id_pengguna,
                },function(){
                    cb(null, "BERHASIL")
                })
            }
            
            Cuti.beforeRemote('ttdHRD', async(context)=>{
                try{
                    docs = await(Cuti.find({where:{id:context.args.id_cuti}}))
                    return
                }catch(err){
                    if (err) throw err
                }
            })
        }
    }
};
