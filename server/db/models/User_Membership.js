const mongoose = require('mongoose');
const UserMembershipSchema = require('./schemas/User_Membership');
module.exports = mongoose.model('user_memberships',UserMembershipSchema);