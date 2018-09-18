const level = require('level');
const config = require('./config')('./config.json');

cache = (function (){  
    let cacheDb = level(config.cache);

    function _load(key, rawData) {
        rawData = JSON.parse(rawData);
        let ticks = Math.floor((Date.now() - rawData.created_on)/1000);

        //expire cache when data is older then 1 day
        if ( ticks > 86400) {                    
            throw new Error(`cache expired ${key} > ${ticks}`);
        }
        
        return rawData.data;
    }

    return {
        get: async function(key) {
            try {
                let err, value = await cacheDb.get(key);

                if (err){
                    if (err.notFound) {
                        throw new Error("not found");
                    }
                    throw new Error(`failed to get ${key}`);
                }

                let data = _load(key, value);
                console.log(new Date().toLocaleString(), key, "from cache");
                return data;
            } catch(e) {
                console.log(e.message);
                throw e;
            }
        },
        put: async function(key,value) {
            try {
                let err = await cacheDb.put(key, JSON.stringify({created_on: Date.now(), data: value}));
                if (err) {
                    throw new Error(`Unable to create ${key} with ${value}`);
                }
                console.log(new Date().toLocaleString(), key, "cached");
                return key;            
            } catch(e) {
                console.log(e.message);
                throw e;
            }
        }
    }
})();

module.exports = cache;