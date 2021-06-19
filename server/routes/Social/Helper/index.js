const Group = require('../../../db/models/Group');
const {ObjectId} = require('mongoose').Types;

async function getAllGroupInfo(inGroupId, inShowAllInfo) {

    const tempGroupId = ObjectId(inGroupId);

    if (inShowAllInfo) {
        return new Promise((resolve,reject)=>{
            Group.aggregate([
                { $addFields: { "totalMembers": {$size: "$userMembers"}}},
                { $match: { _id: tempGroupId } },
                { $unwind: {path: "$userMembers", preserveNullAndEmptyArrays: true } },
                {
                    $lookup:
                    {
                        from: "users",
                        let: { uId: "$userMembers.userId", stat: "$userMembers.status", isad: "$userMembers.isAdmin" },
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr:
                                    {
                                        $and:
                                            [
                                                { $eq: ["$_id", "$$uId"] },
                                                { $eq: ["$$stat", "accepted"] },
                                                { $eq: ["$$isad", true] }
                                            ]
                                    }
                                }
                            },
                            {
                                $project:
                                {
                                    profileImg: 1,
                                    coverPhoto: 1
                                }
                            }
                        ],
                        as: "userAdmins"
                    },
                },
                { $unwind: {path: "$userAdmins", preserveNullAndEmptyArrays: true }},
                {
                    $lookup:
                    {
                        from: "users",
                        let: { uId: "$userMembers.userId", stat: "$userMembers.status", isad: "$userMembers.isAdmin" },
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr:
                                    {
                                        $and:
                                            [
                                                { $eq: ["$_id", "$$uId"] },
                                                { $eq: ["$$stat", "accepted"] },
                                                { $eq: ["$$isad", false] }
                                            ]
                                    }
                                }
                            },
                            {
                                $project:
                                {
                                    profileImg: 1,
                                    coverPhoto: 1
                                }
                            }                            
                        ],
                        as: "members"
                    },
                },
                { $unwind: {path: "$members", preserveNullAndEmptyArrays: true }},
                {
                    $lookup:
                    {
                        from: 'user_posts',
                        localField: '_id',
                        foreignField: 'groupsId',
                        as: 'post'
                    }
                },
                {
                    $group:
                    {
                        _id: "$_id",
                        userId: { $first: "$userId" },
                        groupName: { $first: "$groupName" },
                        description: { $first: "$description" },
                        coverPhoto: { $first: "$coverPhoto" },
                        privacySettings: { $first: "$privacySettings" },
                        status: { $first: "$status" },
                        totalMembers: { $first: "$totalMembers" },
                        posts: {
                            $push: "$post"
                        },
                        userMembers: {
                            $push: "$members"
                        },
                        userAdmins: {
                            $push: "$userAdmins"
                        }
                    }
                }
            ]).exec((error,result)=>{
                if(error){
                    reject(error);
                }
                if(result.length === 0){
                    reject(`No data found for user in group ${inGroupId}`);
                }
                else{
                    resolve(result);
                }
            });
        });
    }
    else {
        return new Promise((resolve,reject)=>{
            Group.aggregate([
                { $addFields: { "totalMembers": {$size: "$userMembers"}}},
                { $match: { _id: tempGroupId } },
                { $unwind: {path: "$userMembers", preserveNullAndEmptyArrays: true } },
                {
                    $lookup:
                    {
                        from: "users",
                        let: { uId: "$userMembers.userId", stat: "$userMembers.status", isad: "$userMembers.isAdmin" },
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr:
                                    {
                                        $and:
                                            [
                                                { $eq: ["$_id", "$$uId"] },
                                                { $eq: ["$$stat", "accepted"] },
                                                { $eq: ["$$isad", true] }
                                            ]
                                    }
                                }
                            },
                            {
                                $project:
                                {
                                    profileImg: 1,
                                    coverPhoto: 1
                                }
                            }
                        ],
                        as: "userAdmins"
                    },
                },
                { $unwind: {path: "$userAdmins", preserveNullAndEmptyArrays: true }},
                {
                    $group:
                    {
                        _id: "$_id",
                        userId: { $first: "$userId" },
                        groupName: { $first: "$groupName" },
                        description: { $first: "$description" },
                        coverPhoto: { $first: "$coverPhoto" },
                        privacySettings: { $first: "$privacySettings" },
                        status: { $first: "$status" },
                        totalMembers: { $first: "$totalMembers" },
                        userAdmins: {
                            $push: "$userAdmins"
                        }
                    }
                }
            ]).exec((error,result)=>{
                if(error){
                    reject(error);
                }
                else if(result.length === 0){
                    reject(`No data found for user in group ${inGroupId}`);
                }
                else{
                    resolve(result);
                }
            });
        });
    }
}

module.exports = {
    getAllGroupInfo
};
