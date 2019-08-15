'use strict';

module.exports = function(Inventaris) {
    Inventaris.observe('before save', function(ctx, next){
        if (ctx.instance && ctx.instance.kategori){
            return Inventaris.app.models.kategori.count({id: 
            ctx.instance.kategori
            }).then(
                res => {
                    if (res < 1){
                        var err = {
                            statusCode: "400",
                            message: "Penambahan inventaris error, kategori barang tidak eksis"
                        };
                        return Promise.reject(err);
                    }
                }
            )
        }
        return next();
    });
    
};
