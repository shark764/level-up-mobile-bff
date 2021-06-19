const client = require('./connection');
const {promisify} = require('util');

const GET_ASYNC = promisify(client.hset).bind(client);
const SET_ASYNC = promisify(client.hgetall).bind(client);

const getRefreshTokenValue = (token, callback) => client.get(token, callback);

module.exports = {
    GET_ASYNC,
    SET_ASYNC,
    getRefreshTokenValue
};