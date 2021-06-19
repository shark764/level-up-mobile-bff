const mongoose = require('mongoose');

const UserFriendSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },

    friendUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },

    requestDate: {
        type: Date,
        default: Date.now()
    },

    acceptedDate: {
        type: Date
    },
    
    rejectedDate: {
        type: Date
    },
    
    statusRequest: {
        type: String,
        default: "pending"
    }    
});

const UserFriend = mongoose.model('user_friend',UserFriendSchema);
module.exports = UserFriend;