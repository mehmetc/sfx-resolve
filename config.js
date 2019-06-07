const fs = require('fs');

function config(filePath) {
}

var config = function(filePath){
    let conf = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    return conf;
};


module.exports = config;