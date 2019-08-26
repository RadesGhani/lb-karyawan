// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var config = require('../../server/config.json');
var path = require('path');

//Replace this address with your actual address
var senderAddress = 'noreply@loopback.com'; 

//link website
var frontend = "http://192.168.3.29:3000/reset_pass"; //frontend

module.exports = function(User) {  
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

  //logic apabila team_project tidak exist dalam POST
  User.observe('before save', function(ctx, next){
    if (ctx.instance && ctx.instance.team_project){
        return User.app.models.team_project.count({id: 
        ctx.instance.team_project

        }).then(
            res => {
                if (res < 1){
                    var err = {
                        statusCode: "400",
                        message: "Penambahan user error, team_project tidak eksis"
                    };
                    return Promise.reject(err);
                }
            }
        )
    }
    return next();
  });
};
