const mongoose = require('mongoose');

const UserMembershipSchema = new mongoose.Schema({
    userFacilityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'user_facilities'
    },

    membershipId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'memberships'
    },

    buyDate:{
        type: Date,
        default: Date.now()
    },

    expirationDate:{
        type: Date,
        required: true,
    },

    paymentMethodId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'payment_methods'
    },

    price:{
        type: Number,
        required: true,
    }

})


module.exports = mongoose.model('user_memberships',UserMembershipSchema);