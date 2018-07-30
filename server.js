/*
  sfxResolve module 
  Resolves an OpenURL against an SFX instance

  KULeuven/LIBIS (c) 2018 
  Mehmet Celik
*/
var app = require('./app');

var port = process.env.PORT || 3000;

var server = app.listen(port, function() {
  console.log('sfxResolver listening on port ' + port);
});