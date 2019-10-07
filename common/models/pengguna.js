// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-example-pengguna-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var config = require('../../server/config.json');
var path = require('path');
var g = require('loopback/lib/globalize');

const app = require('../../server/server');

//Replace this address with your actual address
var senderAddress = 'noreply@loopback.com'; 
var frontend = "https://192.168.0.40:3000/reset_pass"; //frontend

//link website
var frontend = "http://192.168.3.29:3000/reset_pass"; //frontend

module.exports = function(Pengguna) {  
  Pengguna.validatesLengthOf('username', {min: 2}); //username length
  Pengguna.validatesLengthOf('username', {max: 50}); //username length
  Pengguna.validatesFormatOf('username', {with: /^[A-Za-z\\s]*$/});//username validation(only character type will be accepted)
  
  {//logika untuk mengirim email selamat bergabung
    Pengguna.afterRemote('create', function(context, pengguna, next) {
      Pengguna.app.models.Email.send({
        to: pengguna.email,
        from: senderAddress,
        subject: 'Selamat bergabung di perusahaan kami.',
        html: 'Selamat bergabung di perusahaan kami. Username untuk mengakses akun pegawai anda adalah <b>' + pengguna.username + '</b>. Harap selesaikan registrasi akun pegawai anda dengan melakukan reset password melalui link berikut : ' + frontend + ' atau gunakan aplikasi mobile perusahaan.'
      }, function(err) {
        if (err){
          Pengguna.deleteById(pengguna.id);
          return next(err);
        }
        return next();
      })
    });
  }

  {//logika reset password
    Pengguna.on('resetPasswordRequest', function(info) {
      var url = 'https://' + config.host + ':' + config.port + '/reset-password';
      /*var html = 'Click <a href="' + url + '?access_token=' +
          info.accessToken.id + '">here</a> to reset your password';*/
        var html = 'access token untuk mereset password anda: '+ info.accessToken.id;

      Pengguna.app.models.Email.send({
        to: info.email,
        from: senderAddress,
        subject: 'Password reset',
        html: html
      }, function(err) {
        if (err) return console.log('> error sending password reset email');
        console.log('> sending password reset email to:', info.email);
      });
    });
  }

  {//logika validasi password
    Pengguna.validatePassword = function(json) {
      var err,
          passwordProperties = Pengguna.definition.properties.password;

      if (json.length > passwordProperties.max) {
        err = new Error (g.f('Password terlalu panjang: %s (maksimal %d karakter)', json, passwordProperties.max));
        err.code = 'PASSWORD_TOO_LONG';
      } else if (json.length < passwordProperties.min) {
        err = new Error(g.f('Password terlalu singkat: %s (minimal %d karakter)', json, passwordProperties.min));
        err.code = 'PASSWORD_TOO_SHORT';
      } else if(!(new RegExp(passwordProperties.pattern, 'g').test(json))) {
        err =  new Error(g.f('password salah: %s (masukkan huruf kapital, huruf kecil, simbol, dan angka)', json));
        err.code = 'INVALID_PASSWORD';
      } else {
        return true;
      }
      err.statusCode = 422;
      throw err;
    };
  }

  {//logika saldo_cuti
    Pengguna.afterRemote('create', function(context, pengguna, next){
      let today = new Date();
      app.models.saldo_cuti.create([
        {id_pengguna : pengguna.id, tanggal_masuk : today,
        cuti_reguler : 0, cuti_bonus : 0, cuti_bonus_exp : today}
      ],function(err){
        if (err){
          Pengguna.destroyById(pengguna.id);
          throw (err)
        };
        console.log("saldo cuti for pengguna " + pengguna.username + " has been created")
        return next();
      })
    })
  }

  {//logika cuti
    let reg_before, reg_after, bonus_before, bonus_after, penggunaid, tgl_masuk_after, exp_after, id_after, id_cuti;

    Pengguna.beforeRemote('*.__create__cuti', async (context, err) => {
      const error = [{
        statusCode: "400",
        message: "ERROR : Saldo cuti tidak mencukupi."
      },
      {
        statusCode: "400",
        message: "ERROR : ttd_ketua dan ttd_hrd tidak boleh diisi."
      }
      ];
      
      if(context.args.data.ttd_ketua != undefined || context.args.data.ttd_hrd != undefined) throw (error[1])
      const profil = await app.models.profil.find({where:{id_pengguna : context.instance.id}});
      console.log(profil)
      context.args.data.nama = profil[0].nama
      const docs = await app.models.saldo_cuti.find({where:{id_pengguna : context.instance.id}});
      let mulai_cuti = new Date(context.args.data.mulai_cuti.substr(0,4), context.args.data.mulai_cuti.substr(5,2) - 1, context.args.data.mulai_cuti.substr(8,2))
      let selesai_cuti = new Date(context.args.data.selesai_cuti.substr(0,4), context.args.data.selesai_cuti.substr(5,2) - 1, context.args.data.selesai_cuti.substr(8,2))
      let lama_cuti = selesai_cuti - mulai_cuti;
      lama_cuti = (lama_cuti + 86400000) / 86400000;
      
      reg_before = docs[0].cuti_reguler;reg_after = docs[0].cuti_reguler;
      bonus_before = docs[0].cuti_bonus;bonus_after = docs[0].cuti_bonus;
      penggunaid = context.instance.id;
      tgl_masuk_after = docs[0].id_pengguna;
      exp_after = docs[0].cuti_bonus_exp;
      id_after = docs[0].id;
      tgl_masuk_after = docs[0].tanggal_masuk;
      id_cuti = context.args.data.id;

      function hitung_cuti(g,h,i){
        let x = g - lama_cuti;
        if(x < 0){
          let y = lama_cuti - g;
          y = h - y;
          if(y < 0){
            throw (error[0]);
          }else{
            if(i == true){
              reg_after = 0;
              bonus_after = y;
            }else{
              reg_after = y;
              bonus_after = 0;
            }
          }
        }else{
          if(i == true){
            reg_after = x;
          }else{
            bonus_after = x;
          }
        }
      }

      {
        let x = [docs[0].cuti_reguler, docs[0].cuti_bonus, true, false];
        if(context.args.data.tipe_cuti == "reg-first"){
          hitung_cuti(x[0],x[1],x[2])
        }else{
          hitung_cuti(x[1],x[0],x[3])
        }
      }

      context.args.data.saldo_reg_awal = reg_before;
      context.args.data.saldo_reg_akhir = reg_after;
      context.args.data.saldo_bonus_awal = bonus_before;
      context.args.data.saldo_bonus_akhir = bonus_after;
    
      tgl_pengajuan = new Date;
      context.args.data.tgl_pengajuan = tgl_pengajuan.toLocaleString();
      
      console.log(
        "reg_before : " + context.args.data.saldo_reg_awal +
        "\nreg_after : " + context.args.data.saldo_reg_akhir +
        "\nbonus_before : " + context.args.data.saldo_bonus_awal +
        "\nbonus_after : " + context.args.data.saldo_bonus_akhir
      )
      return;
    })

    Pengguna.afterRemote('*.__create__cuti', function(context, unused, next){
      app.models.saldo_cuti.replaceById(id_after, {id : id_after, id_pengguna : penggunaid, cuti_reguler : reg_after, cuti_bonus : bonus_after, cuti_bonus_exp : exp_after, tanggal_masuk : tgl_masuk_after}
      ,function(err){
        if (err){
          app.models.cuti.destroyById(id_cuti)
          throw (err);
        } 
        return next();
      })
    })
  }
};
