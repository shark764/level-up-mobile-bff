const express = require('express')
const ObjectId = require('mongoose').Types.ObjectId
const User_Posts = require('../../db/models/User_Posts')
const User_Friends = require('../../db/models/User_Friends')
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const validateAccess = require('../../middlewares/validateAccess');
const verifyToken = require('../../middlewares/verifyToken');
const router = express.Router()

// Add new post
// POST /social/new/post
router.post('/social/new/post', validateAccess, async (req, res) => {
    const post = new User_Posts({
        ...req.body,
        //userId: '605108e0554dee40405ed798'
        userId: req.user.data._id
    })

    try {
        await post.save()
        return res
            .status(201)
            .json(success({ requestId: req.id, data: post }))
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