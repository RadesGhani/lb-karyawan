'use strict';

module.exports = function(Profil) {
  Profil.validatesUniquenessOf('inisial');
  Profil.validatesInclusionOf('jenis_kelamin', {in: ['Laki', 'Perempuan']});
  Profil.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.instance.id_pengguna) {
      return Profil.app.models.pengguna.count({id_pengguna:
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

  Profil.remoteMethod(
    'nama',
    {
      accepts: {arg: 'id_pengguna', type: "number", required: 'true'},
      http: {path: '/:id/nama', verb: 'post'},
      returns: {arg: 'nama', type: 'object'}
    }
  )

  Profil.nama = async (id_pengguna,err)=>{
    try{
      const docs = await Profil.find({where:{id_pengguna:id_pengguna}})
      const docs1 = await Profil.find({where:{tim:docs[0].tim}})
      let x = 0
      let nama= []
      docs1.forEach(element => {
        nama[x]=docs1[x].nama
        console.log(nama[x])
        x = x + 1
      });
      //console.log (nama)
      return nama
    }catch(err){
      if (err) throw err
    }
  }

};
