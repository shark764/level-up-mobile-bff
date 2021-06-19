const setExpirationDate = (months)=>{
    const now = new Date();
    now.setMonth(now.getMonth() + months);
    return now;
};


module.exports = setExpirationDate;