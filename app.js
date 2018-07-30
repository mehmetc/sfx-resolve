/*
  sfxResolve module 
  Resolves an OpenURL against an SFX instance

  KULeuven/LIBIS (c) 2018 
  Mehmet Celik
*/

var express = require('express');
var cors = require('cors');
var app = express();
var sfxResolve = require('./sfx');

app.use(cors());
app.get('/', function(req, res) {
    try {
        var remoteIp = req.query.ip || null;
        var sfxUrl = req.query.url || null;
      
        if (remoteIp === null || sfxUrl === null) {
            res.status(503);
            res.header('Content-Type', 'application/json ');
            res.json({error: 'Please supply "ip" and "url" parameters'});
            res.end();
        } else {
            if (sfxUrl.includes('sfx.')) {
                const sfx = sfxResolve('https://sfx.metabib.ch/sfx_ilu', remoteIp);
                  
                sfx.resolve(sfxUrl).then(r => {
                    res.json(r);
                    res.end();
                }).catch(err => {
                    res.json(err);
                    res.end();
                });
            } else {
                res.json([]);
                res.end();
            }
      
        }    
    } catch(e) {
        res.json({error: e});
        res.end();
    }
});

module.exports = app;