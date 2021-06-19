const express = require('express');
const app = express();
const User = require('../../db/models/User');
const validateAccess = require('../../middlewares/validateAccess');
const verifyToken = require('../../middlewares/verifyToken');
const {success} = require('../../utils/helpers/response');
const {error} = require('../../utils/helpers/response');
const {ObjectId} = require('mongoose').Types;
const validator = require('validator');

//1. Fetch the user's profile
app.get('/social/profile/:userId', [validateAccess,verifyToken],async (req, res) => {
    try {
        const { userId } = req.params;
        const { reqUserId } = req.body;

        if(!validator.isMongoId(reqUserId)){
            return res.status(400)
            .json(error({
                requestId: req.id,
                code: 400,
                message: `Missing or wrong parameter requested user Id`
            }));
        }

        User.aggregate([
            {//Stage 0 - Main document
                $match: { "_id": ObjectId(reqUserId) }
            },
            {//Join with the user's posts
                $lookup:
                {
                    from: "user_posts",
                    pipeline: [
                        { $match: { userId: ObjectId(reqUserId) } },
                        {
                            $project:
                            {
                                userId: 0
                            }
                        }
                    ],
                    as: "posts"
                }
            },
            {//Join with the asociation user-facilities and facility
                $lookup:
                {
                    from: "user_facilities",
                    pipeline: [
                        { $match: { userId: ObjectId(reqUserId) } },
                        {
                            $lookup:
                            {
                                from: "facilities",
                                let: { facilityId: "$facilityId" },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$_id", "$$facilityId"] } } },
                                    {
                                        $project:
                                        {
                                            _id: 0,
                                            facilityId: "$_id",
                                            name: 1,
                                            description: 1
                                        }
                                    }
                                ],
                                as: "detailFacility"
                            },
                        },
                        {//Join with the asociation user-memberships
                            $lookup:
                            {
                                from: "user_memberships",
                                localField: "_id",
                                foreignField: "userFacilityId",
                                as: "userMemberships"
                            }
                        },
                        { $unwind: "$detailFacility" },
                        {
                            $project:
                            {
                                _id: 0,
                                idRelUserFacility: "$_id",
                                status: 1,
                                dateCreated: 1,
                                facilityId: 1,
                                description: "$detailFacility.description",
                                name: "$detailFacility.name",
                                dateMembership: { $first: "$userMemberships.buyDate" }
                            }
                        }
                    ],
                    as: "facilities"
                }
            },
            {//Join with the user's friends
                $lookup:
                {
                    from: "user_friends",
                    pipeline: [
                        { $match: { userId: ObjectId(reqUserId) } },
                        { $project: { "finalUserId": "$friendUserId" } },
                        {
                            $unionWith:
                            {
                                coll: "user_friends",
                                pipeline: [
                                    { $match: { friendUserId: ObjectId(reqUserId) } },
                                    { $project: { "finalUserId": "$userId" } }
                                ]
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "users",
                                localField: "finalUserId",
                                foreignField: "_id",
                                as: "infoUser"
                            }
                        },
                        { $unwind: "$infoUser" },
                        {
                            $project:
                            {
                                _id: 0,
                                userId: "$infoUser._id",
                                firstName: "$infoUser.firstName",
                                lastName: "$infoUser.lastName",
                                email: "$infoUser.email",
                                active: "$infoUser.active",
                                profileImg: "$infoUser.profileImg",
                                coverPhoto: "$infoUser.coverPhot"
                            }
                        }
                    ], as: "friends"
                }
            },
            {//Select the user whom is viewing the profile, if not exists, they aren't friends, else validate the statusRequest
                $lookup:
                {
                    from: "user_friends",
                    pipeline: [
                        {
                            $match:
                            {
                                $or:
                                    [
                                        {
                                            $and:
                                                [
                                                    { userId: ObjectId(reqUserId) },
                                                    { friendUserId: ObjectId(userId) },
                                                ]
                                        },
                                        {
                                            $and:
                                                [
                                                    { userId: ObjectId(userId) },
                                                    { friendUserId: ObjectId(reqUserId) },
                                                ]
                                        }
                                    ]
                            }
                        }
                    ],
                    as: "areFriends"
                }
            },
            { $unwind: { path: "$areFriends", preserveNullAndEmptyArrays: true } },
            {//Adding new fields
                $addFields:
                {
                    areFriends: { $eq: ["$areFriends.statusRequest", "accepted"] },
                    globalRanking: await User.getGlobalRank(reqUserId),
                }
            },
            {//Selecting the info to show
                $project:
                {
                    _id: 0,
                    myUserId: "$_id",
                    name: { $concat: ["$firstName", ' ', "$lastName"] },
                    email: 1,
                    profileImg: 1,
                    coverPhoto: 1,
                    posts: 1,
                    facilities: 1,
                    areFriends: 1,
                    friends: 1,
                    globalRanking: { $ifNull: ["$globalRanking", 0] }
                }
            }
        ]).exec((e, result) => {
            if(e){
                res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: e.message
                }));
            }else if (result.length === 0) {
                res.status(404)
                .json(error({
                    requestId: req.id,
                    code: 404,
                    message: `No Profile found with ID ${reqUserId}`
                }));
            } else {
                const user = result.pop();
                res.status(200)
                .json(success({
                    requestId: req.id,
                    data: user
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