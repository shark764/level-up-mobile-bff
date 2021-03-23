const express = require('express')
const ObjectId = require('mongoose').Types.ObjectId
const User = require('../../db/models/User')
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const validateAccess = require('../../middlewares/validateAccess');
const router = express.Router()

// Get friend's and group's posts for the user
// GET /social/feed/
router.get('/social/feed/', validateAccess, async (req, res) => {
    try {        
        const feed = await User.aggregate([
            { $match: { "_id": ObjectId(req.user.data._id)} },
            {
                $lookup:
                {
                    from: "user_group_members",
                    pipeline: [
                        { $match: { userId: ObjectId(req.user.data._id) } },
                        {
                            $lookup:
                            {
                                from: "groups",
                                let: { groupId: "$groupId" },
                                pipeline: [
                                    { $match: { $expr: { $eq: ["$_id", "$$groupId"] } } }
                                ],
                                as: "detailGroup"
                            }
                        },
                        { $unwind: "$detailGroup" },
                        {
                            $project:
                            {
                                detailGroup: 1
                            }
                        }
                    ],
                    as: "groups"
                }
            },
            { $unwind: { path: "$groups", preserveNullAndEmptyArrays: true } },
            { $unwind: { path: "$groups.detailGroup", preserveNullAndEmptyArrays: true } },
            {
                $project:
                {
                    _id: 0,
                    groupId: "$groups.detailGroup._id",
                    groupName: "$groups.detailGroup.groupName",
                    description: "$groups.detailGroup.description",
                    coverPhoto: "$groups.detailGroup.coverPhoto",
                    status: "$groups.detailGroup.status",
                    members: { $ifNull: ["$quantity.members", 0] }
                }
            },
            {
                $lookup: {
                    from: 'user_posts',
                    let: { groupId: '$groupId' },
                    pipeline: [
                        { $match: {$expr: { $or: [ { $eq: ['$groupsId', "$$groupId"]} , { $in: [ '$userId', [ObjectId('6054d16693d8a4413c22827d')] ]  } ] }  } }
                    ],
                    as: 'post'
                }
            },
            {
                $unwind: { path: '$post' }
            },
            {
                $sort: {
                    'post.publishDate': -1
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'post.userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: { path: '$user' }
            },
            {
                $addFields: {
                    'post.userId': '$user'
                }
            },
            {
                $project: {
                    'post.userId.password': 0,
                    'user': 0
                }
            },
            {
                $group: { '_id': '$groupName', 'posts': { $push: '$post' } }
            }
        ])

        return res
            .status(201)
            .json(success({ requestId: req.id, data: feed }))
    } catch (err) {
        return res
            .status(400)
            .json(error({ requestId: req.id, code: 400, message: err }))
    }
})

// Update post by id
// PATCH /social/post/60523db879c7cd3ab86342ce
router.patch('/social/post/:id', validateAccess, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['urlMedia','caption', 'title']

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res
            .status(400)
            .json(error({ requestId: req.id, code: 400, message: 'Invalid updates!' }))
    }

    try {
        const post = await User_Posts.findOne({_id: req.params.id, userId: req.user.data._id})
    
        if (!post) {
            return res
                .status(400)
                .json(error({ requestId: req.id, code: 404 }))
        }
    
        updates.forEach((update) => post[update] = req.body[update])
        await post.save()
        
        return res
            .status(201)
            .json(success({ requestId: req.id, data: post }))
    } catch (err) {
        return res
            .status(400)
            .json(error({ requestId: req.id, code: 400, message: e }))
    }

})

router.get('/social/feeds/', validateAccess, async (req, res) => {
    try {
        console.log(req.user.data._id)
        const friendsPosts = await User_Friends.aggregate([{ 
            $lookup: {
                from: 'user_posts', 
                localField: 'friendUserId', 
                foreignField: 'userId', 
                as: 'friend_posts'
            }
        },
        {
            $match: { 
                userId: ObjectId(req.user.data._id),
                friend_posts:  { $ne: []}
            }            
        },
        {
            $sort: {
                "friend_posts.publishDate": -1
            }
        }])
        // const friendsPosts = User_Friends.aggregate([{ 
        //     $lookup: {
        //         from: 'user_posts', 
        //         localField: 'friendUserId', 
        //         foreignField: 'userId', 
        //         as: 'friend_posts'
        //     }
        // },
        // {
        //     $match: { 
        //         userId: ObjectId('6053927de5fc283c3810c5af'),
        //         friend_posts:  { $ne: []}
        //     }            
        // },
        // {
        //     $sort: {
        //         "friend_posts.publishDate": 1
        //     }
        // }],
        // function (err, data) {
        //     res.json(data)
        // })

        res.json(friendsPosts)
    } catch (err) {
        console.log(err)
    }
    // get groups posts
})

module.exports = router