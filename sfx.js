/*
  sfxResolve module 
  Resolves an OpenURL against an SFX instance

  KULeuven/LIBIS (c) 2018 
  Mehmet Celik
*/
const axios = require('axios');
const url = require('url');
const Promise = require('promise');
const querystring = require("querystring");
const convert = require("xml-js");

/**
 * Resolves an OpenURL agains an SFX instance
 * @constructor
 * @param {String} sfxBase - base url of your SFX server
 * @param {String} remoteIp - ip address of the calling client
 */
function sfxResolve(sfxBase, remoteIp) {
  /**
   * Parse an OpenURL into paramaters
   * @param {String} openUrl - OpenURL that SFX needs to query
   */
  function _url2Data(openUrl) {
    let location = url.parse(openUrl);
    return location.search.slice(1).split('&').map(m => {
      let r = m.split('=');
      return r[1].length > 0 ? {
        [r[0]]: decodeURIComponent(r[1])
      } : null
    }).filter(f => f !== null).reduce((p, c) => Object.assign(p, c), {});
  }

  /**
   * Build the SFX url that needs to be resolved
   * @param {String} openUrl - OpenURL that needs to be transformed into an SFX url
   */
  function _buildResolveUrl(openUrl) {
    let data = _url2Data(openUrl);
    let rftObj = Object.keys(data).filter(f => /^rft\./
      .test(f)).map(m => {
      let tag = m.replace('rft.', 'rft:');
      return `<${tag}>${data[m].replace(/&(?!(?:apos|quot|[gl]t|amp);|#)/g, '&amp;')}</${tag}>`;
    }).join("\n");

    let services = '';
    //services += '<sv:fulltext xmlns:sv="info:ofi/fmt:xml:xsd:sch_svc">yes</sv:fulltext>';
    //services += '<sv:any xmlns:sv="info:ofi/fmt:xml:xsd:sch_svc">yes</sv:any>';
    services += '<sv:fulltext xmlns:sv="info:ofi/fmt:xml:xsd:sch_svc">yes</sv:fulltext>'
    services += '<sv:selectedfulltext xmlns:sv="info:ofi/fmt:xml:xsd:sch_svc">yes</sv:selectedfulltext>'


    let contextObject = `<?xml version='1.0' encoding='UTF-8' ?>
 <ctx:context-objects xsi:schemaLocation='info:ofi/fmt:xml:xsd:ctx http://www.openurl.info/registry/docs/info:ofi/fmt:xml:xsd:ctx' xmlns:ctx='info:ofi/fmt:xml:xsd:ctx' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance'>
 <ctx:context-object timestamp='${data["ctx_tim"].replace('IST', 'Z')}' version='${data["ctx_ver"]}' identifier='001'>
 <ctx:referent>
     <ctx:metadata-by-val>
     <ctx:format>info:ofi/fmt:kev:mtx:journal</ctx:format>
     <ctx:metadata>
     <rft:journal
         xmlns:rft='info:ofi/fmt:kev:mtx:journal'>
     ${rftObj}
     <rft:object_id></rft:object_id>
     </rft:journal>
     </ctx:metadata>
     </ctx:metadata-by-val>
     </ctx:referent>
     <ctx:requester>
     <ctx:metadata-by-val>
     <ctx:format>info:ofi/req</ctx:format>
     <ctx:metadata>
     <req:ip xmlns:req='info:ofi/req'>${remoteIp}</req:ip>
     </ctx:metadata>
     </ctx:metadata-by-val>
     </ctx:requester>
     <ctx:service-type>
     <ctx:metadata-by-val>
     <ctx:format>info:ofi/fmt:xml:xsd:sch_svc</ctx:format>
     <ctx:metadata>
     ${services}
     </ctx:metadata>
     </ctx:metadata-by-val>
     </ctx:service-type>
     <ctx:referrer>
     <ctx:identifier>${data['rfr_id']}</ctx:identifier>
     </ctx:referrer>
 </ctx:context-object>
 </ctx:context-objects>`;

    //console.log(contextObject);

    let query = querystring.stringify({
      url_ctx_val: contextObject
    });
    query += `&sfx.response_type=multi_obj_xml&res_id=${sfxBase}&url_ctx_fmt=info:ofi/fmt:xml:xsd:ctx`;

    //let query = encodeURI(`url_ctx_val=${contextObject}&url_ctx_fmt=info:ofi/fmt:xml:xsd:ctx&sfx.response_type=multi_obj_xml&res_id=${sfxBase}`);

    return {
      openUrl: `${sfxBase}`,
      query: query
    };
  }

  return {
    /**
     * Resolve an OpenUrl into fulltext links
     * @param {String} openUrl - The OpenURL that needs to be resolved
     * @example 
     * const sfx = sfxResolve('https://sfx.at.my.domain/sfx_my', remoteIp);                  
     * sfx.resolve(sfxUrl).then(r => {
     *  console.log(r);
     * }).catch(err => {
     *  console.log(err);
     * });
     */ 
    resolve: function(openUrl) {
      return new Promise((resolve, reject) => {
        let {
          openUrl: baseUrl,
          query: body
        } = _buildResolveUrl(openUrl);
        //console.log(`${baseUrl}?${body}`);

        axios.get(`${baseUrl}?${body}`, {
          headers: {
            'Content-Type': 'application/xml'
          }
        }).then((response) => {          
          console.log(new Date().toLocaleString(), remoteIp, JSON.stringify(_url2Data(openUrl)) );
          //console.log("\n\n"+response.data+"\n\n");
          let data = convert.xml2js(response.data, {
            compact: true,
            ignoreComment: true,
            ignoreDeclaration: true
          });

          if (data && data.ctx_obj_set && data.ctx_obj_set.ctx_obj && data.ctx_obj_set.ctx_obj.ctx_obj_targets) {
            let target_data = [];
            let obj_targets = data.ctx_obj_set.ctx_obj.ctx_obj_targets.target;
        
            if (obj_targets && !Array.isArray(obj_targets)) {
              obj_targets = [obj_targets];
            }

            if (obj_targets && Array.isArray(obj_targets)) {
              obj_targets.forEach(target => {
                target_data.push({target_url:target.target_url['_text'], facility: 'ZHB / Uni / PH / HSLU', target_name:target.target_public_name['_text']});
              });
            }
            resolve(target_data);
          } else {
            reject(`SFX Error1: no data`);
          }

        }).
        catch((e) => {
          console.log('SFX Error2', e);
          reject(`SFX Error2: ${e}`);
        });
      });
    }
  };
}

module.exports = sfxResolve;
