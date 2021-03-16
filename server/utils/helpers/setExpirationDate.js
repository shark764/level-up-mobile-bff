const setExpirationDate = (months)=>{
    let now = new Date();
    now.setMonth(now.getMonth() + months);
    return now;
}


module.exports = setExpirationDate