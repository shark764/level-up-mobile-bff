const mongoose = require('mongoose');

const SafetyVideoSchema = new mongoose.Schema({
    facilityId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "facilities"
    },

    name:{
        type: String
    },

    description:{
        type: String
    },

    videoURL:{
        type: String,
        required: true
    },

    active:{
        type: Boolean
    }
});

const SafetyVideo = mongoose.model('safety_video',SafetyVideoSchema);
module.exports = SafetyVideo;