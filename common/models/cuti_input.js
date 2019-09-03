'use strict';

module.exports = function(Cuti) {
    Cuti.observe('before save', function updateUserId(ctx, next){
        var userId = ctx.options.accessToken.userId

        if (ctx.instance) {
            ctx.instance.user_id = userId;
        } else {
            ctx.data.user_id = userId;
        }
        next();
    });

};
