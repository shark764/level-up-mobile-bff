const mongoose =require('mongoose')

const PaymentMethodSchema = new mongoose.Schema({
    paymentMethod:{
        type: String,
        required: true,
        unique: true,
        trim: true,
    }
})


PaymentMethodSchema.statics.getIdByName = async(name)=>{
    const paymentMethod = await PaymentMethod.find({});
    let method = paymentMethod.pop();
    return method ? method : false;
}

const PaymentMethod = mongoose.model('payment_methods',PaymentMethodSchema);

module.exports = PaymentMethod;