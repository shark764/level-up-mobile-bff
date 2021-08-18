const mongoose = require('mongoose');
const SafetyVideoSchema = require('./schemas/Safety_Video');

const SafetyVideo = mongoose.model('safety_video',SafetyVideoSchema);
module.exports = SafetyVideo;