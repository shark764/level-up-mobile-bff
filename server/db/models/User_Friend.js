const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

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


UserFriendSchema.statics.areFriends = (inUserId, inUserFriendId) => {

    const userId = ObjectId(inUserId);
    const userFriendId = ObjectId(inUserFriendId);

    console.log(`Los datos son\nUserId in Path ${userFriendId}\nMy UserId ${userId}`);

    return new Promise((resolve, reject) => {
        UserFriend.aggregate([
            {
                $match:
                {
                    $or:
                        [
                            {
                                $and:
                                    [
                                        { "userId": userId },
                                        { "friendUserId": userFriendId },
                                    ]
                            },
                            {
                                $and:
                                    [
                                        { "userId": userFriendId },
                                        { "friendUserId": userId },
                                    ]
                            }
                        ]
                }
            }
        ]).exec((e, result) => {
            if (e) {
                reject({ statusCode: 500, message: e.message });
            }
            else {
                const oneRow = result.pop();
                resolve(oneRow.statusRequest === "accepted");
            }
        });
    });
}


const UserFriend = mongoose.model('user_friend', UserFriendSchema);
module.exports = UserFriend;