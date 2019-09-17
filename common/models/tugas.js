/* eslint-disable camelcase */
'use strict';

// userID task

module.exports = function(Tugas) {
  Tugas.observe('access', function limitToTenant(ctx, next) {
    var authorizedRoles = ctx.options.authorizedRoles;
    var storeId = ctx.options.currentUser.team_name_id;

    if (!authorizedRoles.admin) {
      ctx.query.where = ctx.query.where || {};
      ctx.query.where.nama_tim = storeId;
    }
    next();
  });

  Tugas.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.instance.nama_tim) {
      return Tugas.app.models.tim.count({nama_tim:
      ctx.instance.nama_tim,
      }).then(
          res => {
            if (res < 1) {
              var err = {
                statusCode: '400',
                message: 'Penambahan tugas error, tim tidak eksis',
              };
              return Promise.reject(err);
            }
          }
      );
    }
    return next();
  });
      // only admin in each team_project who can only create task team_project in group that they own as admin
  Tugas.observe('before save', function(ctx, next) {
    var teamId = ctx.options.currentUser.team_name_id;
    if (ctx.instance && ctx.instance.nama_tim) {
      if (ctx.instance.nama_tim != teamId) {
        var err = {
          statusCode: '401',
          message: 'Authorization Required',
        };
        return Promise.reject(err);
      }
    }
    return next();
  });
};
