'use strict';

module.exports = function(Profile) {
    Profile.validatesUniquenessOf('code_name');
    Profile.validatesInclusionOf('sex', {in: ['male', 'female']});

    Profile.observe('before save', function(ctx, next){
        if (ctx.instance && ctx.instance.user_Id){
             return Profile.app.models.user.count({id: 
             ctx.instance.user_Id
             }).then(
                 res => {
                     if (res < 1){
                         var err = {
                             statusCode: "400",
                             message: "Penambahan profile error, username tidak eksis"
                         };
                         return Promise.reject(err);
                     }
                }
             )
         }
         return next();
     });
     Profile.observe('before save', function(ctx, next){
     if (ctx.instance && ctx.instance.user_Id){
        return Profile.app.models.profile.count({user_Id: 
        ctx.instance.user_Id
        }).then(
            res => {
                if (res >= 1){
                    var err = {
                        statusCode: "400",
                        message: "Penambahan profile error, username sudah diisi profile"
                    };
                    return Promise.reject(err);
                }
           }
        )
    }
    return next();
});
};
