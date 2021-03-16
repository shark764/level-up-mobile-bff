const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    price:{
        type: Number,
        required: true,
    },

    name:{
        type: String,
        required: true
    },

    benefits:[
        {type: String,required: true}
    ],

    validPeriod: {
        type: Number,
        required: true
    },

    facilityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'facilities'
    }
})

module.exports = mongoose.model('memberships',membershipSchema);