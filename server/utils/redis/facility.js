const client = require('./connection')

const redisCheckIn = ()=> {
    const setCheckIn = (key,data, callback) => {
        var d = new Date();
        var h = d.getHours();
        var m = d.getMinutes();
        var s = d.getSeconds();
        var secondsUntilEndOfDay = (24*60*60) - (h*60*60) - (m*60) - s;
        return client.set(key,data,'EX',secondsUntilEndOfDay,callback);
    }
    
    const getCheckIn = (key, callback) => {
        return client.get(key, callback);
    } 
    
    return{setCheckIn, getCheckIn} ;
}

module.exports =  redisCheckIn