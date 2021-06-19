const express = require('express');
const app = express();
const User = require('../../db/models/User');
const validateAccess = require('../../middlewares/validateAccess');
const verifyToken = require('../../middlewares/verifyToken');
const {success} = require('../../utils/helpers/response');
const {error} = require('../../utils/helpers/response');
const {ObjectId} = require('mongoose').Types;

//2. Fetch the user's friends with status request = accepted
app.get('/social/friends/:userId',[validateAccess,verifyToken], async (req, res) => {
    try {
        //Get the parameters
        const { userId } = req.params;

        User.aggregate([
            {
                $match: { "_id": ObjectId(userId) }
            },
            {
                $lookup:
                {
                    from: "user_friends",
                    pipeline: [
                        { $match: { userId: ObjectId(userId), statusRequest: "accepted" } },
                        {
                            $lookup:
                            {
                                from: "users",
                                let: { friendUserId: "$friendUserId" },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$_id", "$$friendUserId"] } } },
                                    {
                                        $addFields:
                                        {
                                            globalRanking: 0//User.getGlobalRank()
                                        }
                                    },
                                    {
                                        $project:
                                        {
                                            firstName: 1,
                                            lastName: 1,
                                            profileImg: 1,
                                            coverPhoto: 1
                                        }
                                    }
                                ],
                                as: "detailFriend"
                            }
                        },
                    ],
                    as: "friends"
                }
            },
            { $unwind: { path: "$friends", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$friends.detailFriend", preserveNullAndEmptyArrays: true } },
            {
                $project:
                {
                    _id: 0,
                    id: "$friends._id",
                    userId: "$friends.detailFriend._id",
                    firstName: "$friends.detailFriend.firstName",
                    lastName: "$friends.detailFriend.lastName",
                    profileImg: "$friends.detailFriend.profileImg",
                    coverPhoto: "$friends.detailFriend.coverPhoto",
                    globalRanking: { $ifNull: ["$globalRanking", 0] }
                }
            }
        ]).exec((e, friends) => {
            console.log(error);
            if(e){
                res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: e.message
                }));
            }else if (friends.length === 0) {
                res.status(400)
                .json(error({
                    requestId: req.id,
                    code: 400,
                    message: `No Profile found with that ID ${req.params.userId}`
                }));
            } else {
                res.status(200)
                .json(success({
                    requestId: req.id,
                    data: friends
                }));
            }
        });
    } catch (e) {
        console.log(e);
        res.status(500)
        .json(error({
            requestId: req.id,
            code: 500,
            message: e.message
        }));
    }
});

module.exports = app;