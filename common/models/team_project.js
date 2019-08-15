'use strict';

module.exports = function(Team_project) {
    Team_project.observe('before save', function(ctx, next){
        if (ctx.instance && ctx.instance.name_team){
            return Team_project.app.models.team_project.count({name_team: 
            ctx.instance.name_team
            }).then(
                res => {
                    if (res >= 1){
                        var err = {
                            statusCode: "400",
                            message: "Penambahan team_project error, team_project sudah ada"
                        };
                        return Promise.reject(err);
                    }
                }
            )
        }
        return next();
    });
};
