/* eslint-disable camelcase */
'use strict';

module.exports = function(History_presensi) {
  History_presensi.observe('before save', function updateUserId(ctx, next) {
    var userId = ctx.options.accessToken.userId;

    if (ctx.instance) {
      ctx.instance.user_id = userId;
    }
    next();
  });
};
