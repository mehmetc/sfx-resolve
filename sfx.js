/*
  sfxResolve module 
  Resolves an OpenURL against an SFX instance

  KULeuven/LIBIS (c) 2018 
  Mehmet Celik
*/
const axios = require('axios');
const url = require('url');
const convert = require("xml-js");
const md5 = require('md5');
const cache = require('./cache');

const config = require('./config')('./config.json');

sfxResolver = (function () {
  /**
   * Parse an OpenURL into paramaters
   * @param {String} openUrl - OpenURL that SFX needs to query
   */
  function _url2Data(openUrl) {
    const location = url.parse(openUrl);

    return location.search.slice(1).split('&').map(m => {
      let r = m.split('=');
      return r && r[1] && r[1].length > 0 ? {
        [r[0]]: decodeURIComponent(r[1])
      } : null
    }).filter(f => f !== null).reduce((p, c) => Object.assign(p, c), {});
  }

  /**
   * 
   * @param {string} rawData 
   * @param {string} facilityCode 
   */
  function _parseSfxResponse(rawData, facility) {
    let targetData = [];
    let data = convert.xml2js(rawData, {
      compact: true,
      ignoreComment: true,
      ignoreDeclaration: true
    });

    if (data && data.ctx_obj_set && data.ctx_obj_set.ctx_obj && data.ctx_obj_set.ctx_obj.ctx_obj_targets) {
      let obj_targets = data.ctx_obj_set.ctx_obj.ctx_obj_targets.target;

      if (obj_targets && !Array.isArray(obj_targets)) {
        obj_targets = [obj_targets];
      }

      if (obj_targets && Array.isArray(obj_targets)) {
        obj_targets.filter(f => f.service_type['_text'] == 'getFullTxt')
          .forEach(target => {            
            targetData.push(classify(facility, target.target_public_name['_text'],  target.target_url['_text']))
          });
      }
    }

    return targetData;
  }


  function classify(facility, targetName, targetUrl){    
    if (/http:\/\/site.ebrary.com\/lib\/zhbluzern\//.test(targetUrl)) {
        facility = 'ZHB / Uni / PH';
        targetName = 'Ebrary';
        targetUrl = targetUrl;
    } else if (/www.dibizentral.ch/.test(targetUrl)) {
        facility = '';            
        targetName = 'DiBiZentral';
        targetUrl = targetUrl;       
    } else if (/univportal.naxosmusiclibrary.com/.test(targetUrl)) {
        facility = 'HSLU';            
        targetName = 'Naxos Music Library';
        targetUrl = targetUrl;       
    } else if (/imslp.org/.test(targetUrl)) {
        facility = '';            
        targetName = 'International Music Score Library Project';
        targetUrl = targetUrl;                   
    } else if (/rzblx10.uni-regensburg.de/.test(targetUrl)) {            
        facility = 'ZHB / Uni / PH';
        targetName = 'Datenbank-Infosystem';
        targetUrl = targetUrl;            
    } 

    return { 
      target_url: targetUrl,
      facility: facility,
      target_name: targetName
    }
}

  /**
   * Build the SFX url that needs to be resolved
   * @param {String} openUrl - OpenURL that needs to be transformed into an SFX url
   */
  function _buildResolveUrl(openUrl) {
    let query = `${openUrl}&sfx.response_type=multi_obj_xml&url_ctx_fmt=info:ofi/fmt:xml:xsd:ctx`;
    return query;
  }

  async function _resolveUrl(query) {
    try {
      return await axios.get(query, {
        headers: {
          'Content-Type': 'application/xml'
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  /** build a hash from relevent data entries */
  function _hash(openUrl) {
    const data = _url2Data(openUrl);
    return md5(Object.keys(data).filter(f => /rft\./.test(f)).map(m => data[m]).join(''));
  }


  async function asyncResolve(openUrl, remoteIp='0.0.0.0') {
    let targetData = [];
    const hash = _hash(openUrl);

    try {
      targetData = await cache.get(hash, remoteIp);
    } catch (e) {
      console.log(new Date().toLocaleString(), remoteIp, hash, "from service");

      let endpoint_names = []
      const endpoints = config.endpoints.map(m => {
        let query = `${m.url}${(url.parse(openUrl)).search}`;

        endpoint_names.push(m.name);
        return axios.get(_buildResolveUrl(query));
      });

      const responses = await Promise.all(endpoints);
      responses.forEach((r, i) => {
        targetData = targetData.concat(_parseSfxResponse(r.data, endpoint_names[i]));
      })

      if (targetData) {
        cache.put(hash, targetData, remoteIp);
      }
    }

    return targetData;
  }

  return {
    resolve: async function (openUrl, remoteIp='0.0.0.0') {
      let data = await asyncResolve(openUrl, remoteIp);

      return data;
    }
  }
})();

module.exports = sfxResolver;