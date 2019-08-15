'use strict';

//userID task

    

module.exports = function(Task) {
    Task.observe('before save', function(ctx, next){
       if (ctx.instance && ctx.instance.team_project){
            return Task.app.models.team_project.count({id: 
            ctx.instance.team_project
            }).then(
                res => {
                    if (res < 1){
                        var err = {
                            statusCode: "400",
                            message: "Penambahan tugas error, team_project tidak eksis"
                        };
                        return Promise.reject(err);
                    }
               }
            )
        }
        return next();
    });
    Task.observe('before save', function(ctx, next){
      if (ctx.instance && ctx.instance.user_id){
          return Task.app.models.user.count({id: 
          ctx.instance.user_id
          }).then(
              res => {
                  if (res < 1){
                      var err = {
                          statusCode: "400",
                          message: "Penambahan tugas error, username tidak eksis"
                    };
                      return Promise.reject(err);
                  }
              }
          )
      }
      return next();
  });
};
