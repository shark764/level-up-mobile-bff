

const validatePaymentPayload = async(data,price)=>{
    console.log("Checking payload...")
    let {Type,payload} = data
    if(payload.amount === price){
        //  Payment gateway should go here... based on Type.
        return true;
    }
    return false
}

module.exports = validatePaymentPayload