// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-example-user-management
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

module.exports = function(User) {  
  User.validatesLengthOf('username', {min: 2}); //username length
  User.validatesLengthOf('username', {max: 8}); //username length
  User.validatesFormatOf('username', {with: /^[A-Za-z\\s]*$/});//username validation(only character type will be accepted)
  //logic untuk mengirim email selamat bergabung
  User.afterRemote('create', function(context, user, next) {
    User.app.models.Email.send({
      to: user.email,
      from: senderAddress,
      subject: 'Selamat bergabung di perusahaan kami.',
      html: 'Selamat bergabung di perusahaan kami. Username untuk mengakses akun pegawai anda adalah <b>' + user.username + '</b>. Harap selesaikan registrasi akun pegawai anda dengan melakukan reset password melalui link berikut : ' + frontend + ' atau gunakan aplikasi mobile perusahaan.'
    }, function(err) {
      if (err){
        User.deleteById(user.id);
        return next(err);
      }
        return next();
      })
    });
  //send password reset link when requested
  User.on('resetPasswordRequest', function(info) {
    var url = 'https://' + config.host + ':' + config.port + '/reset-password';
    /*var html = 'Click <a href="' + url + '?access_token=' +
        info.accessToken.id + '">here</a> to reset your password';*/
      var html = 'access token untuk mereset password anda: '+ info.accessToken.id;

    User.app.models.Email.send({
      to: info.email,
      from: senderAddress,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });

//password validation

  User.validatePassword = function(json) {
    var err,
        passwordProperties = User.definition.properties.password;

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

  //remote-method membuat saldo_cuti untuk karyawan baru
  User.afterRemote('create', function(context, user, next){
    let today = new Date();
    app.models.saldo_cuti.create([
      {user_id : user.id, joining_date : today,
      cuti_reguler : 0, cuti_bonus : 0, cuti_bonus_exp : today}
    ],function(err){
      if (err) throw (err);
      console.log("saldo cuti for user " + user.username + " has been created")
      return next();
    })
  })

  {//remote-method cuti_input
    let reg_before, reg_after, bonus_before, bonus_after;

    User.beforeRemote('*.__create__cuti_input', async (context, err) => {
      const docs = await app.models.saldo_cuti.find({where:{user_id : context.instance.id}});
      console.log("user: " + docs[0].user_id + "\ncuti_type: " + context.args.data.cuti_type);
      
      let start_date = new Date(context.args.data.start_date.substr(0,4), context.args.data.start_date.substr(5,2) - 1, context.args.data.start_date.substr(8,2))
      let end_date = new Date(context.args.data.end_date.substr(0,4), context.args.data.end_date.substr(5,2) - 1, context.args.data.end_date.substr(8,2))
      let lama_cuti = end_date - start_date;
      lama_cuti = (lama_cuti + 86400000) / 86400000;

      const error = {
        statusCode: "400",
        message: "ERROR : Saldo cuti tidak mencukupi."
      };
      
      reg_before = docs[0].cuti_reguler;reg_after = docs[0].cuti_reguler;
      bonus_before = docs[0].cuti_bonus;bonus_after = docs[0].cuti_bonus;

      function hitung_cuti(g,h,i){
        let x = g - lama_cuti;
        if(x < 0){
          let y = lama_cuti - g;
          y = h - y;
          if(y < 0){
            throw (error);
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
        if(context.args.data.cuti_type == "reg-first"){
          hitung_cuti(x[0],x[1],x[2])
        }else{
          hitung_cuti(x[1],x[0],x[3])
        }
      }

      context.args.data.saldo_cuti_reg_before = reg_before;
      context.args.data.saldo_cuti_reg_after = reg_after;
      context.args.data.saldo_cuti_bonus_before = bonus_before;
      context.args.data.saldo_cuti_bonus_after = bonus_after;
      
      
      console.log(
        "reg_before : " + context.args.data.saldo_cuti_reg_before +
        "\nreg_after : " + context.args.data.saldo_cuti_reg_after +
        "\nbonus_before : " + context.args.data.saldo_cuti_bonus_before +
        "\nbonus_after : " + context.args.data.saldo_cuti_bonus_after
      )
      return;
    })

    User.afterRemote('*.__create__cuti_input', function(context, unused, next){
      app.models.saldo_cuti.update(
        {cuti_reguler : reg_after, cuti_bonus : bonus_after}
      ,function(err){
        if (err) throw (err);
        return next();
      })
    })
  }
  

  User.beforeRemote('*.__create__saldo_cuti', function(context, unused, next){
    {
      console.log("OK");
      return next();
    }
  })
};
