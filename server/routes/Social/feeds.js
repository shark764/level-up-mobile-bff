const express = require('express')
const ObjectId = require('mongoose').Types.ObjectId
const User = require('../../db/models/User')
const User_Friends = require('../../db/models/User_Friends')
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const validateAccess = require('../../middlewares/validateAccess');
const router = express.Router()

// Get friend's and group's posts for the user
// GET /social/feed/
router.get('/social/feed/', validateAccess, async (req, res) => {
    const user_friends = await User_Friends.find({ userId: req.user.data._id }).distinct('friendUserId')
    try {
        const feed = await User.aggregate([
    
            { $match: { "_id": ObjectId(req.user.data._id)} },
            {
                $lookup: {
                    from: 'groups',                
                    pipeline: 
                    [
                        { $match: { 'userMembers.userId': ObjectId(req.user.data._id) } },
                    ],
                    as: 'groups'
                }
            },
            { $unwind: "$groups" },
            {
                $project: {
                    'groups':1
                }
            },
            {
                    $lookup: {
                        from: 'user_posts',
                        let: { groupId: '$groups._id' },
                        pipeline: [
                            { $match: {$expr: { $or: [ { $eq: ['$groupsId', "$$groupId"]} , { $in: [ '$userId', user_friends ]  } ] }  } }
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

module.exports = router