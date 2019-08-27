// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var config = require('../../server/config.json');
var path = require('path');

//Replace this address with your actual address
var senderAddress = 'noreply@loopback.com'; 

module.exports = function(User) {
  //delete User.validations.username;
  //send verification email after registration
  User.afterRemote('create', function(context, user, next) {
    var options = {
      type: 'email',
      to: user.email,
      from: senderAddress,
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      host: 'https://192.168.100.36',
      text: 'Click the link bellow to complete your registration. You can login from the login page after that\n\t{href}',
      user: user
    };

    user.verify(options, function(err) {
      if (err) {
        User.deleteById(user.id);
        return next(err);
      }
        return next();
    });
  });

  //send password reset link when requested
  User.on('resetPasswordRequest', function(info) {
    var url = 'https://' + config.host + ':' + config.port + '/reset-password';
    /*var html = 'Click <a href="' + url + '?access_token=' +
        info.accessToken.id + '">here</a> to reset your password';*/
      var html = 'access token to reset your password : '+ info.accessToken.id;

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

};
