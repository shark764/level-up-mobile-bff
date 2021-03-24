const mongoose = require('mongoose');

const UserMatchSchema = new mongoose.Schema({
    userFacilityId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_facility'
    },
    score:{
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('user_match', UserMatchSchema);