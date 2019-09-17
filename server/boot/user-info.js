/* eslint-disable strict */
/* eslint-disable max-len */

module.exports = function(app) {
  app.remotes().phases
    .addBefore('invoke', 'options-from-request')
    .use(function(ctx, next) {
      if (!ctx.args.options || !ctx.args.options.accessToken) return next();

      // attach user info to context options
      const User = app.models.pengguna;
      User.findById(ctx.args.options.accessToken.userId, function(err, pengguna) {
        if (err) return next(err);
        ctx.args.options.currentUser = pengguna;
        next();
      });
    });
};
