/* eslint-disable camelcase */
'use strict';
const app = require('../../server/server');

module.exports = function(Kehadiran) {
  let tgl = new Date();
  let date = tgl.getUTCDate(), month = tgl.getUTCMonth()
  if(date<10){
    date = 0 + "" + date ;
  };
  if(month<10){
    month = 0 + "" + month;
  };
  tgl = tgl.getUTCFullYear() + "-" + month + "-" + date;
  
  {//masuk
    let namaPengguna
    Kehadiran.remoteMethod(
      'masuk',
      {
        accepts: {arg: 'id_pengguna', type: "string", required: 'true'},
        http: {path: '/:id/masuk', verb: 'post'},
        returns: {arg: 'masuk', type: 'object'}
      }
    )
  
    Kehadiran.masuk = function (id, cb){
      let masuk = new Date();
      masuk = masuk.getTime();
      
      Kehadiran.create([
        {id_pengguna : id, tanggal: tgl,
         waktu_masuk: masuk, waktu_keluar: null, nama_pengguna: namaPengguna}
      ],function(err, kehadiran){
        cb(null, kehadiran);
      })
    }

    Kehadiran.beforeRemote('masuk', async (context, err) => {
      console.log(context.args.id_pengguna)
      const error = {
        statusCode: "400",
        message: "ERROR : Anda telah melakukan presensi masuk hari ini atau id_pengguna yang anda masukan tidak valid."
      };
      const docs = await Kehadiran.find({where:{and: [{tanggal:tgl}, {id_pengguna:context.args.id_pengguna}]}});
      const docs1 = await app.models.pengguna.findById(context.args.id_pengguna);
      console.log(docs1)
      if(docs[0] != "undefined"){
        throw error;
      }else{
        namaPengguna = docs1.username;
        return;
      }
    })
  }
  

  {//pulang
    let docs;
    Kehadiran.remoteMethod(
      'pulang', {
        accepts: {arg: 'id_pengguna', type: "string", required: 'true'},
        http: {path: '/:id/pulang', verb: 'post'},
        returns: {arg: 'pulang', type: 'object'}
      }
    )
    
    Kehadiran.pulang = function (id, cb){
      let pulang = new Date();
      pulang = pulang.getTime();
      Kehadiran.replaceById(docs[0].id,{
        id:docs[0].id, id_pengguna:docs[0].id_pengguna, tanggal: docs[0].tanggal,
        waktu_masuk: docs[0].waktu_masuk, waktu_keluar: pulang, nama_pengguna: docs[0].nama_pengguna
      },function(err, kehadiran){
        if (err){return Promise.reject(err)};
        cb(null, kehadiran);
      })
    }

    Kehadiran.beforeRemote('pulang', async (context, err) => {
      const error = [{
        statusCode: "400",
        message: "ERROR : Anda belum melakukan presensi masuk hari ini."
      },
      {
        statusCode: "400",
        message: "ERROR : Anda telah melakukan presensi keluar hari ini."
      }
      ];

      docs = await Kehadiran.find({where:{and: [{tanggal:tgl},{id_pengguna:context.args.id_pengguna}]}});
      if(docs[0] != undefined){
        if(docs[0].waktu_keluar != null){
          throw error[1];
        }else{
          return;
        }
      }else{
        throw error[0];
      }
    })
  }
};
