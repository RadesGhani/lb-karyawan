/* eslint-disable camelcase */
'use strict';

module.exports = function(Pinjaman) {
  Pinjaman.observe('before save', function updateUserId(ctx, next) {
    var userId = ctx.options.accessToken.userId;

    if (ctx.instance) {
      ctx.instance.user_id = userId;
    }
    next();
  });
  Pinjaman.observe('access', function limitToTenant(ctx, next) {
    var authorizedRoles = ctx.options.authorizedRoles;
    var userId = ctx.options.accessToken.userId;

    if (!authorizedRoles.admin) {
      ctx.query.where = ctx.query.where || {};
      ctx.query.where.user_id = userId;
    }
    next();
  });
};
