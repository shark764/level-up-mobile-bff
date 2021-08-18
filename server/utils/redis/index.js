const client = require('./connection');


const removeKey = (key, callback) => client.del(key, callback);
const getKey = (token, callback) => client.get(token, callback);


module.exports = {
    getKey,
    removeKey
};
