// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var config = require('../../server/config.json');
var path = require('path');
var g = require('loopback/lib/globalize');

const app = require('../../server/server');
const models = app.models;

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

  User.afterRemote('*.__get__saldo_cuti', function(ctx, unused, next){
    {
      console.log(models.saldo_cuti);
      return next();
    }
  })
};
