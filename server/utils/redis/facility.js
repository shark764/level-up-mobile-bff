const client = require('./connection');

const redisCheckIn = ()=> {
    const setCheckIn = (key,data, callback) => {
        const d = new Date();
        const h = d.getHours();
        const m = d.getMinutes();
        const s = d.getSeconds();
        const secondsUntilEndOfDay = (24*60*60) - (h*60*60) - (m*60) - s;
        return client.set(key,data,'EX',secondsUntilEndOfDay,callback);
    };
    
    return{setCheckIn} ;
};

module.exports =  redisCheckIn;