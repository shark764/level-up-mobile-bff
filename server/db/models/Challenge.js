const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const challengeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'games',
        required: false,
    },

    matchId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matches',
        required: false,
    },

    requiredScore: {
        type: Number,
        required: true,
    },

    imageUrl: {
        type: String,
        required: false,
    },

    status: {
        type: String,
        required: true,
        default: 'active'
    },

    type: {
        type: String,
        required: true
    },

    timeFrame: {
        type: Number,
        required: true,
    }
})



const Challenge = mongoose.model('challenges', challengeSchema)

module.exports = Challenge