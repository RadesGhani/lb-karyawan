/* eslint-disable camelcase */
'use strict';

// userID task

module.exports = function(Task) {
  Task.observe('access', function limitToTenant(ctx, next) {
    var authorizedRoles = ctx.options.authorizedRoles;
    var storeId = ctx.options.currentUser.team_name_id;

    if (!authorizedRoles.admin) {
      ctx.query.where = ctx.query.where || {};
      ctx.query.where.team_name_id = storeId;
    }
    next();
  });

  Task.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.instance.team_name_id) {
      return Task.app.models.team_project.count({id:
      ctx.instance.team_name_id,
      }).then(
          res => {
            if (res < 1) {
              var err = {
                statusCode: '400',
                message: 'Penambahan task error, team_project tidak eksis',
              };
              return Promise.reject(err);
            }
          }
      );
    }
    return next();
  });
      // only admin in each team_project who can only create task team_project in group that they own as admin
  Task.observe('before save', function(ctx, next) {
    var teamId = ctx.options.currentUser.team_name_id;
    if (ctx.instance && ctx.instance.team_name_id) {
      if (ctx.instance.team_name_id != teamId) {
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
