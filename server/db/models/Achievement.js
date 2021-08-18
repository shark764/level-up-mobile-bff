const mongoose = require('mongoose');
const achievementSchema = require('./schemas/Achievement');

const Achievement = mongoose.model('achievements', achievementSchema);

module.exports = Achievement;
