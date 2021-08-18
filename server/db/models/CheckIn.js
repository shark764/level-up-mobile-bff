const mongoose = require('mongoose');
const CheckinSchema = require('./schemas/CheckIn');
const CheckIn = mongoose.model('checkin', CheckinSchema);
module.exports = CheckIn;