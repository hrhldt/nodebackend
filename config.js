var secureRandom = require('secure-random');
var signingKey = secureRandom(256, {type: 'Buffer'});
module.exports = {
    'secret': signingKey,
    'database': 'mongodb://localhost:27017/local',
    'iss' : 'https://workr.com'
};
