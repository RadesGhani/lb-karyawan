'use strict';

module.exports = function(Salary) {
    Salary.observe('before save', function(ctx, next){
        if (ctx.instance && ctx.instance.user_id){
            return Salary.app.models.user.count({id: 
            ctx.instance.user_id
            }).then(
                res => {
                    if (res < 1){
                        var err = {
                            statusCode: "400",
                            message: "Penambahan salary error, user tidak eksis"
                        };
                        return Promise.reject(err);
                    }
                }
            )
        }
        return next();
    });
    Salary.observe('before save', function(ctx, next){
        if (ctx.instance && ctx.instance.user_id){
            return Salary.app.models.salary.count({user_id: 
            ctx.instance.user_id
            }).then(
                res => {
                    if (res >= 1){
                        var err = {
                            statusCode: "400",
                            message: "Penambahan salary error, user sudah diisi salary"
                        };
                        return Promise.reject(err);
                    }
                }
            )
        }
        return next();
    });
};
