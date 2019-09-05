var server = require('./server');
var ds = server.dataSources.mongoDs;
var lbTables = ['salary'];
ds.autoupdate(lbTables, function(er) {
  if (er) throw er;
  console.log('Loopback tables [' + lbTables + '] created in ', ds.adapter.name);
  ds.disconnect();
});

