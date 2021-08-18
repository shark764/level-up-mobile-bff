const mongoose = require('mongoose');
const UserFacility = require('./User_Facility');
const UserMatch = require('./User_Match');
const Group = require('../models/Group');
const UserFriend = require('../models/User_Friend');
const { ObjectId } = mongoose.Types;
const userSchema = require('./schemas/User');


// Get a rank/score of a specific user/facility.
userSchema.statics.getRankByFacility = async (userId, facilityId) => {
    try {
        const userFacilities = await UserFacility.find({ facilityId }).distinct('_id');
        const userFacility = await UserFacility.findOne({ facilityId, userId });
        return new Promise((resolve, reject) => {
            userFacility ?
                UserMatch.aggregate([
                    {
                        "$match": {
                            "userFacilityId": {
                                "$in": userFacilities
                            }
                        }
                    },
                    {
                        "$group": {
                            "_id": "$userFacilityId",
                            "score": {
                                "$sum": "$score"
                            },

                        }
                    },
                    {
                        "$sort": {
                            "score": -1
                        }
                    },

                    {
                        "$group": {
                            "_id": null,
                            "docs": { "$push": "$$ROOT" }
                        }
                    },
                    {
                        "$project": {
                            "_id": 0,
                            "R": {
                                "$map": {
                                    "input": { "$range": [0, { "$size": "$docs" }] },
                                    "in": {
                                        "$mergeObjects": [
                                            { "rank": { "$add": ["$$this", 1] } },
                                            { "$arrayElemAt": ["$docs", "$$this"] }
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {
                        "$unwind": "$R"
                    },
                    {
                        "$replaceRoot": { "newRoot": "$R" }
                    },
                    {
                        "$match": { "_id": userFacility._id }
                    }



                ]).exec((err, results) => {
                    // console.log("Resultsss",results);
                    if (err) reject(err);
                    if (results.length === 0) reject("Check query based error");
                    resolve(results.pop());
                }) : reject("No userFacilityFound please check params.");
        });
    } catch (e) {
        throw new Error(e);
    }

};

userSchema.statics.leaderBoard = () => new Promise((resolve, reject) => {
        UserMatch.aggregate([
            {
                "$group": {
                    "_id": "$userFacilityId",
                    "score": {
                        "$sum": "$score"
                    },
                }
            },
            {
                "$lookup": {
                    "from": "user_facilities",
                    "let": { "id": '$_id' },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", "$$id"]
                                }
                            }
                        },
                        {
                            "$project": {
                                "userId": 1,
                                "facilityId": 1,
                            }
                        }
                    ],
                    "as": "userFacility"
                }
            },
            {
                "$unwind": {
                    "path": "$userFacility"
                }
            },
            {
                "$group": {
                    "_id": "$userFacility.userId",
                    "score": {
                        "$sum": "$score",
                    },
                }
            },
            {
                "$sort": {
                    "score": -1
                }
            },
            {
                "$group": {
                    "_id": null,
                    "docs": { "$push": "$$ROOT" }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "R": {
                        "$map": {
                            "input": { "$range": [0, { "$size": "$docs" }] },
                            "in": {
                                "$mergeObjects": [
                                    { "rank": { "$add": ["$$this", 1] } },
                                    { "$arrayElemAt": ["$docs", "$$this"] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                "$unwind": "$R"
            },
            {
                "$replaceRoot": { "newRoot": "$R" }
            },

        ]).exec((e, results) => {
            if (e) {
                reject(e);
            }
            resolve(results);
        });
    });

// Get the global rank with score of user.
userSchema.statics.getGlobalRank = (userId) => new Promise((resolve, reject) => {
        UserMatch.aggregate([
            {
                "$group": {
                    "_id": "$userFacilityId",
                    "score": {
                        "$sum": "$score"
                    },
                }
            },
            {
                "$lookup": {
                    "from": "user_facilities",
                    "let": { "id": '$_id' },
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {
                                    "$eq": ["$_id", "$$id"]
                                }
                            }
                        },
                        {
                            "$project": {
                                "userId": 1,
                                "facilityId": 1,
                            }
                        }
                    ],
                    "as": "userFacility"
                }
            },
            {
                "$unwind": {
                    "path": "$userFacility"
                }
            },
            {
                "$group": {
                    "_id": "$userFacility.userId",
                    "score": {
                        "$sum": "$score",
                    },
                }
            },
            {
                "$sort": {
                    "score": -1
                }
            },
            {
                "$group": {
                    "_id": null,
                    "docs": { "$push": "$$ROOT" }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "R": {
                        "$map": {
                            "input": { "$range": [0, { "$size": "$docs" }] },
                            "in": {
                                "$mergeObjects": [
                                    { "rank": { "$add": ["$$this", 1] } },
                                    { "$arrayElemAt": ["$docs", "$$this"] }
                                ]
                            }
                        }
                    }
                }
            },
            {
                "$unwind": "$R"
            },
            {
                "$replaceRoot": { "newRoot": "$R" }
            },
            {
                "$match": {
                    "_id": ObjectId(userId)
                }
            }

        ]).exec((e, results) => {
            if (e)
                reject({statusCode: 500});
            if (results.length === 0)
                resolve({ rank: null, _id: userId, score: 0 });
            resolve(results.pop());
        });
    });

// Get ranking with score in facilities of user.
userSchema.statics.getRankingInFacilities = async (userId) => {
    try {
        // Get facilities in which user is member.
        const facilities = await UserFacility.find({ userId }).distinct("facilityId");

        return new Promise((resolve, reject) => {
            UserFacility.aggregate([

                {
                    "$match": {
                        "facilityId": {
                            "$in": facilities
                        }
                    }
                },
                {
                    "$lookup": {
                        "from": "user_matches",
                        "let": { "facid": "$_id" },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$eq": ["$userFacilityId", "$$facid"]
                                    }
                                }
                            },

                        ],
                        "as": "matches"
                    }
                },
                {
                    "$unwind": {
                        "path": "$matches"
                    }
                },
                {
                    "$group": {
                        "_id": "$_id",
                        "score": {
                            "$sum": "$matches.score"
                        },
                        "facilityId": {
                            "$first": "$facilityId"
                        },

                        "userId": {
                            "$first": "$userId"
                        }

                    }
                },
                {
                    "$sort": {
                        "score": -1
                    }
                },
                {
                    "$group": {
                        "_id": null,
                        "docs": { "$push": "$$ROOT" }
                    }
                },
                {
                    "$project": {
                        "_id": 0,
                        "R": {
                            "$map": {
                                "input": { "$range": [0, { "$size": "$docs" }] },
                                "in": {
                                    "$mergeObjects": [
                                        { "rank": { "$add": ["$$this", 1] } },
                                        { "$arrayElemAt": ["$docs", "$$this"] }
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    "$unwind": "$R"
                },
                {
                    "$replaceRoot": { "newRoot": "$R" }
                },
                {
                    "$match": {
                        "userId": ObjectId(userId),
                    }
                },
                {
                    "$lookup": {
                        "from": "facilities",
                        "let": { "fac": "$facilityId" },
                        "pipeline": [
                            {
                                "$match": {
                                    "$expr": {
                                        "$eq": ["$_id", "$$fac"]
                                    }
                                }
                            }
                        ],
                        "as": "facility"
                    }
                },

                {
                    "$unwind": {
                        "path": "$facility"
                    }
                },
                {
                    "$project": {
                        "facility.__v": 0,
                        "facilityId": 0
                    }
                }



            ]).exec((err, results) => {
                console.log("results", results);
                if (err) reject(err);
                resolve(results);
            });

        });
    } catch (e) {
        throw new Error(e);
    }
};

// add avatar picture
userSchema.statics.addAvatar = async (url, id) => {
    const user = await User.findById(id);
    user.userProfile.photo = url;
    await user.save();
    return user;
};

userSchema.statics.findUserInGroups =  (inUserId) => {

    const tempUserId = ObjectId(inUserId);

    return new Promise((resolve, reject) => {
        Group.aggregate([
            { $addFields: { "totalMembers": { $size: "$userMembers" } } },
            { $unwind: { path: "$userMembers", preserveNullAndEmptyArrays: true } },
            {
                $match:
                {
                    $expr:
                    {
                        $and:
                            [
                                { $eq: ["$userMembers.userId", tempUserId] },
                                { $eq: ["$userMembers.status", "accepted"] }
                            ]
                    }
                }
            },
            {
                $project:
                {
                    _id: 0,
                    groupId: "$_id",
                    userId: "$userId",
                    groupName: "$groupName",
                    description: "$description",
                    coverPhoto: "$coverPhoto",
                    privacySettings: "$privacySettings",
                    status: "$status",
                    userMembers: "$userMembers",
                    totalMembers: "$totalMembers",
                }
            },
            {
                $unionWith:
                {
                    coll: "groups",
                    pipeline: [
                        { $addFields: { "totalMembers": { $size: "$userMembers" } } },
                        { $match: { userId: tempUserId } },
                        {
                            $project:
                            {
                                _id: 0,
                                groupId: "$_id",
                                userId: "$userId",
                                groupName: "$groupName",
                                description: "$description",
                                coverPhoto: "$coverPhoto",
                                privacySettings: "$privacySettings",
                                status: "$status",
                                userMembers: "$userMembers",
                                totalMembers: "$totalMembers",
                            }
                        }
                    ]
                }
            }
        ]).exec((error, result) => {
            if (error) {
                reject(error);
            }
            if (result.length === 0) {
                reject(`No data found for User ${inUserId}`);
            }
            else {
                resolve(result);
            }
        });
    });
};


userSchema.statics.findUserNotInGroups =  (inUserId) => {

    const tempUserId = ObjectId(inUserId);

    return new Promise((resolve, reject) => {
        Group.aggregate([

            {
                $unwind: { path: "$userMembers", preserveNullAndEmptyArrays: true }
            },
            {
                $match:
                {
                    $expr:
                    {
                        $or:
                            [
                                { $and: [{ $eq: ["$userMembers.userId", tempUserId] }, { $eq: ["$userMembers.status", "accepted"] }] },
                                { $eq: ["$userId", tempUserId] }
                            ]
                    }
                }
            },
            {
                $group: { "_id": "$_id" }
            },
            {
                $project:
                {
                    _id: 0,
                    "id2": "$_id"
                }
            },
            {
                $group: { _id: null, docs: { $push: "$id2" } }
            },
            {
                $project:
                {
                    _id: 0
                }
            },
            {
                $lookup:
                {
                    from: "groups",
                    let: { ids: "$docs" },
                    pipeline: [
                        { $match: { $expr: { $not: { $in: ["$_id", "$$ids"] } } } },
                        {
                            $addFields:
                            {
                                "totalMembers": { $size: "$userMembers" }
                            }
                        },
                    ],
                    as: "groups"
                }
            },
            { $unwind: "$groups" },
            {
                $project:
                {
                    groupId: "$groups._id",
                    userId: "$groups.userId",
                    groupName: "$groups.groupName",
                    description: "$groups.description",
                    coverPhoto: "$groups.coverPhoto",
                    privacySettings: "$groups.privacySettings",
                    status: "$groups.status",
                    userMembers: "$groups.userMembers",
                    totalMembers: "$groups.totalMembers",
                }
            }
        ]).exec((error, result) => {
            if (error) {
                reject(error);
            }
            if (result.length === 0) {
                reject(`No data found for User ${inUserId}`);
            }
            else {
                resolve(result);
            }
        });
    });
};

userSchema.statics.myFriendsGroups = (inUserId) => {

    const tempUserId = ObjectId(inUserId);

    return new Promise((resolve, reject) => {

        //Get the groups wher the user not in        
        Group.aggregate([
            {
                $unwind: { path: "$userMembers", preserveNullAndEmptyArrays: true }
            },
            {
                $match:
                {
                    $expr:
                    {
                        $or:
                            [
                                { $and: [{ $eq: ["$userMembers.userId", tempUserId] }, { $eq: ["$userMembers.status", "accepted"] }] },
                                { $eq: ["$userId", tempUserId] }
                            ]
                    }
                }
            },
            {
                $group: { "_id": "$_id" }
            },
            {
                $project:
                {
                    _id: 0,
                    "id2": "$_id"
                }
            },
            {
                $group: { _id: 0, docs: { $push: "$id2" } }
            },
            {
                $project:
                {
                    _id: 0
                }
            },
            {
                $lookup:
                {
                    from: "groups",
                    let: { ids: "$docs" },
                    pipeline: [
                        { $match: { $expr: { $not: { $in: ["$_id", "$$ids"] } } } },
                    ],
                    as: "groups"
                }
            },
            { $unwind: "$groups" },
            {
                $group:
                {
                    _id: null,
                    tempGroupsId: {
                        $push: "$groups._id"
                    }
                }
            },
            {
                $project:
                {
                    _id: 0,
                    tempGroupsId: 1
                }
            }
        ]).exec((error, groupList) => {

            if (error) {
                reject(error);
            }
            if (groupList.length === 0) {
                reject(`No data groups found for User ${inUserId}`);
            }
            else {
                const groupsUserNotIn = groupList.pop();

                //Get the users from groups where user not in
                Group.aggregate([
                    {
                        $match:
                        {
                            $expr:
                            {
                                $in: ["$_id", groupsUserNotIn.tempGroupsId]
                            }
                        }
                    },
                    {
                        $project:
                        {
                            _id: 0,
                            tempUserId: "$userId"
                        }
                    },
                    {
                        $unionWith:
                        {
                            coll: "groups",
                            pipeline: [
                                { $unwind: { path: "$userMembers", preserveNullAndEmptyArrays: true } },
                                {
                                    $match:
                                    {
                                        $expr:
                                        {
                                            $and:
                                                [
                                                    { $in: ["$_id", groupsUserNotIn.tempGroupsId] },
                                                    { $eq: ["$userMembers.status", "accepted"] }
                                                ]
                                        }
                                    }
                                },
                                {
                                    $project:
                                    {
                                        _id: 0,
                                        tempUserId: "$userMembers.userId"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $group:
                        {
                            _id: null,
                            finalUserIds: {
                                $push: "$tempUserId"
                            }
                        }
                    },
                    {
                        $project:
                        {
                            _id: 0,
                            finalUserIds: 1
                        }
                    }
                ]).exec((error, userList) => {

                    if (error) {
                        reject(error);
                    }
                    if (userList.length === 0) {
                        reject(`No data friends found for User ${inUserId}`);
                    }
                    else {
                        const tempUserFriends = userList.pop();

                        UserFriend.aggregate([
                            {
                                $match:
                                {
                                    $expr:
                                    {
                                        $and:
                                            [
                                                { $eq: ["$userId", tempUserId] }
                                                , { $in: ["$friendUserId", tempUserFriends.finalUserIds] }
                                                , { $eq: ["$statusRequest", "accepted"] }
                                            ]
                                    }
                                }
                            },
                            {
                                $project:
                                {
                                    _id: 0,
                                    tempFinalFriendId: "$friendUserId"
                                }
                            },
                            {
                                $unionWith:
                                {
                                    coll: "user_friends",
                                    pipeline: [
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$friendUserId", tempUserId] }
                                                            , { $in: ["$userId", tempUserFriends.finalUserIds] }
                                                            , { $eq: ["$statusRequest", "accepted"] }
                                                        ]
                                                }
                                            }
                                        },
                                        {
                                            $project:
                                            {
                                                _id: 0,
                                                tempFinalFriendId: "$userId"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                $group:
                                {
                                    _id: null,
                                    finalFriendId: {
                                        $push: "$tempFinalFriendId"
                                    }
                                }
                            },
                            {
                                $project:
                                {
                                    _id: 0,
                                    finalFriendId: 1
                                }
                            }
                        ]).exec((error, friendList) => {

                            if (error) {
                                reject(error);
                            }
                            if (friendList.length === 0) {
                                reject(`No data friends list found for User ${inUserId}`);
                            }
                            else {
                                const friendListValidate = friendList.pop();

                                Group.aggregate([
                                    { $addFields: { "totalMembers": { $size: "$userMembers" } } },
                                    {
                                        $match:
                                        {
                                            $expr:
                                            {
                                                $and:
                                                    [
                                                        { $in: ["$_id", groupsUserNotIn.tempGroupsId] },
                                                        { $in: ["$userId", friendListValidate.finalFriendId] }
                                                    ]
                                            }
                                        }
                                    },
                                    {
                                        $unionWith:
                                        {
                                            coll: "groups",
                                            pipeline: [
                                                { $addFields: { "totalMembers": { $size: "$userMembers" } } },
                                                { $unwind: { path: "$userMembers", preserveNullAndEmptyArrays: true } },
                                                {
                                                    $match:
                                                    {
                                                        $expr:
                                                        {
                                                            $and:
                                                                [
                                                                    { $in: ["$_id", groupsUserNotIn.tempGroupsId] },
                                                                    { $not: { $in: ["$userId", friendListValidate.finalFriendId] } },
                                                                    { $in: ["$userMembers.userId", friendListValidate.finalFriendId] }
                                                                ]
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        $project:
                                        {
                                            userMembers: 0
                                        }
                                    }
                                ]).exec((error, result) => {
                                    if (error) {
                                        reject(error);
                                    }
                                    if (result.length === 0) {
                                        reject(`No data found for User ${inUserId}`);
                                    }
                                    else {
                                        resolve(result);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
};

userSchema.statics.findUserInGroup = (inGroupId, inUserId, inOption) => {

    const tempGroupId = ObjectId(inGroupId);
    const tempUserId = ObjectId(inUserId);

    return new Promise((resolve, reject) => {
        Group.aggregate([
            { $unwind: "$userMembers" },
            {
                $match:
                {
                    $expr:
                    {
                        $and:
                            [
                                { $eq: ["$_id", tempGroupId] },
                                {
                                    $or:
                                        [
                                            { $and: [{ $eq: ["$userMembers.userId", tempUserId] }, { $eq: ["$userMembers.status", "accepted"] }] },
                                            { $eq: ["$userId", tempUserId] },
                                        ]
                                }
                            ]
                    }
                }
            }
        ]).exec((error, result) => {
            if (error) {
                reject(error);
            }
            if (result.length === 0) {
                if (inOption) {
                    resolve(result);
                }
                else {
                    reject(`No data found for User ${inUserId} and Group ${inGroupId}`);
                }
            }
            else {
                const data = result.pop();
                resolve(data);
            }
        });
    });
};

userSchema.statics.userIsAdmin = (inGroupId, inUserId) => {

    const tempGroupId = ObjectId(inGroupId);
    const tempUserId = ObjectId(inUserId);

    return new Promise((resolve, reject) => {
        Group.aggregate([
            { $unwind: "$userMembers" },
            {
                $match:
                {
                    $expr:
                    {
                        $and:
                            [
                                { $eq: ["$_id", tempGroupId] },
                                {
                                    $or:
                                        [
                                            { $and: [{ $eq: ["$userMembers.userId", tempUserId] }, { $eq: ["$userMembers.status", "accepted"] }, { $eq: ["$userMembers.isAdmin", true] }] },
                                            { $eq: ["$userId", tempUserId] },
                                        ]
                                }
                            ]
                    }
                }
            }
        ]).exec((error, result) => {
            if (error) {
                reject(error);
            }
            if (result.length === 0) {
                reject(`Permission denied for User ${inUserId} is not an administrator in Group ${inGroupId}`);
            }
            else {
                resolve(result);
            }
        });
    });
};

const User = mongoose.model('users', userSchema);
module.exports = User;
