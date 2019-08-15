'use strict';

module.exports = function(Kehadiran) {
    Kehadiran.observe('before save', function updateUserId(ctx, next){
        var userId = ctx.options.accessToken.userId

        if (ctx.instance) {
            ctx.instance.user_id = userId;
        }
        next();
    });
    
};
