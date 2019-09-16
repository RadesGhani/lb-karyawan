'use strict';

module.exports = function(Profil) {
  Profil.validatesUniquenessOf('inisial');
  Profil.validatesInclusionOf('jenis_kelamin', {in: ['Laki', 'Perempuan']});
  Profil.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.instance.id_pengguna) {
      return Profil.app.models.pengguna.count({id:
      ctx.instance.id_pengguna,
      }).then(
            res => {
              if (res < 1) {
                var err = {
                  statusCode: '400',
                  message: 'Penambahan profile error, username tidak eksis',
                };
                return Promise.reject(err);
              }
            }
        );
    }
    return next();
  });
};
