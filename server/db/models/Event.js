const mongoose = require('mongoose')

const EventsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    name: {
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    location:{
        type: {type: String, default: "Point"},
        coordinates: [{type: Number, required: true}]
    },
    privacySettings: {
        type: String,
        required: true
    },
    coverImageUrl: {
        type: String
    }
})


const Events = mongoose.model('events', EventsSchema)

module.exports = Events