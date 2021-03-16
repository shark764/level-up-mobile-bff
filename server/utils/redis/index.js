const Redis = require('ioredis')
const {promisify} = require('util')

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
})

const GET_ASYNC = promisify(client.hset).bind(client);
const SET_ASYNC = promisify(client.hgetall).bind(client);

module.exports = {
    GET_ASYNC,
    SET_ASYNC
}