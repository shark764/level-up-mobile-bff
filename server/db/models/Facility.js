const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
    name:{
            type: String,
            required: true,
    },

    address:{
            type: String,
            required: true,
    },

    location:{
        type: {type: String, default: "Point"},
        coordinates: [{type: Number, required: true}]
    },

    schedule:{
            type: String,
            required: true,
    },

    phoneNumber: {
            type: String,
    },

    pictures:[
        {
            image:{
                type: String,
            },

            comment:{
                type: String,
            }
        }
    ],

    zones:[
        {
            name: {
                type: String
            },

            description:{
                type: String
            }
        }
    ],

    amenities:[
        {type: String}
    ]  
})

module.exports = mongoose.model("Facilities",facilitySchema);