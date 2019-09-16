'use strict';

module.exports = function(Gaji) {
  Gaji.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.instance.user_id) {
      return Gaji.app.models.user.count({id:
            ctx.instance.user_id,
      }).then(
                res => {
                  if (res < 1) {
                    var err = {
                      statusCode: '400',
                      message: 'Penambahan salary error, user tidak eksis',
                    };
                    return Promise.reject(err);
                  }
                }
            );
    }
    return next();
  });
  Gaji.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.instance.user_id) {
      return Gaji.app.models.gaji.count({user_id:
            ctx.instance.user_id,
      }).then(
                res => {
                  if (res >= 1) {
                    var err = {
                      statusCode: '400',
                      message: 'Penambahan salary error, user sudah diisi salary',
                    };
                    return Promise.reject(err);
                  }
                }
            );
    }
    return next();
  });
};
