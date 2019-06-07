/*
  sfxResolve module 
  Resolves an OpenURL against an SFX instance

  KULeuven/LIBIS (c) 2018 
  Mehmet Celik
*/

const express = require('express');
const cors = require('cors');
const app = express();
const sfxResolver = require('./sfx');
const fs = require('fs');
const config = require('./config')('./config.json');

// set cors headers to allow cross domain calls from the browser 
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
app.use(cors());

/**
 * This is the main application. Only 1 parameter is needed 'url' it should contain the OpenURL
 * @example https://sfxresolve?url=[OpenUrl]
 */
app.get('/', async (req, res, next) => {
    try {
        const sfxUrl = req.query.url || null;
        const remoteIp = req.query.ip || '0.0.0.0';
        
        //fail is 'url' parameter is null
        if (sfxUrl === null || sfxUrl.length == 0) {
            res.status(503);
            res.header('Content-Type', 'application/json ');
            res.json({
                error: 'Please supply OpenUrl in "url" parameter'
            });
            res.end();
        } else {

            response = await sfxResolver.resolve(sfxUrl, remoteIp);
            res.json(response);
            res.end();
        }
    } catch (e) {
        //return the caught error
        next(e);
    }
});

/**
 * return reclassify.json
 * 
 * reclassify.json structure
 * {
 *      "targetUrl": {
 *          "facility": "name of the Institution",
 *          "name": "display name",
 *          "url": "overwrite targetUrl"
 *      }
 * }
 */
app.get('/reclassify', async(req, res, next) => {
    try {
        res.status(200);
        res.header('Content-Type', 'application/json ');
        res.json(JSON.parse(fs.readFileSync(config.reclassify, 'utf8')));
        res.end();

    } catch(e) {
        next(e);
    }
})


//make app public
module.exports = app;