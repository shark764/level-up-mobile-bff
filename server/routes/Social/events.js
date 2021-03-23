const express = require('express')
const ObjectId = require('mongoose').Types.ObjectId
const User = require('../../db/models/User')
const Event = require('../../db/models/Event')
const Users_Events_Attendance = require('../../db/models/User_Event_Attendance')
const validateAccess = require('../../middlewares/validateAccess')
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const router = express.Router()


/// POST /socia/new/event/
router.post('/social/new/event', validateAccess, async (req, res) => {
    const event = new Event({
        ...req.body,
        userId: req.user.data._id        
    })

    try {
        await event.save()
        res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { event }
            }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
})

/// PATCH /social/event/605a4e692a9ba84270be1479
router.patch('/social/event/:id', validateAccess, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'eventDate', 'description', 'status', 'location', 'privacySettings', 'coverImageUrl', 'location.coordinates']

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).json(error({ requestId: req.id, code: 400, message: 'Invalid updates!' }))
    }

    try {
        const event = await Event.findOne({ _id: req.params.id, userId: req.user.data._id })
    
        if (!event) {
            return res.status(404).json(error({ requestId: req.id, code: 404 }))
        }
    
        updates.forEach((update) => event[update] = req.body[update])
        await event.save()
        res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { event }
            }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
})


/// GET /social/event/605a4e692a9ba84270be1479
router.get('/social/event/:id',validateAccess, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
        
        if (!event) {
            return res.status(404).json(error({ requestId: req.id, code: 404 }))
        }
    
        res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { event }
            }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
})

// /// Get user unattending events
// /// GET /social/event/unattending
router.get('/social/unattending/event/', validateAccess, async (req, res) => {
    try {
        const events = await Users_Events_Attendance.find({ userId: req.user.data._id, isAccepted: false })

        if (!events) {
            return res.status(404).json(error({ requestId: req.id, code: 404 }))
        }

        res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { events }
            }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
})

/// POST /social/event/attend/:id
router.post('/social/attend/event/:id', validateAccess, async (req, res) => {
    try {
        const event = await Users_Events_Attendance.findOne({ userId: req.user.data._id, eventId: req.params.id })
        if (!event) {
            return res.status(404).json(error({ requestId: req.id, code: 404 }))
        }
        event.isAccepted = true
        await event.save()
        res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { event }
            }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
})


/// DELETE /social/attend/event/:id
router.delete('/social/attend/event/:id', validateAccess, async (req, res) => {    
    try {
        const event = await Users_Events_Attendance.findOneAndDelete({ userId: req.user.data._id, eventId: req.params.id })
        if (!event) {
            return res.status(404).json(error({ requestId: req.id, code: 404 }))
        }
        res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { event }
            }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
})

router.get('/social/upcoming/event', validateAccess, async (req, res) => {
    try {
        const events = await User.aggregate([
            { $match: { "_id": ObjectId(req.user.data._id )}},
            {
                $lookup: {
                    from: "users_events_attendances",
                    let: { userId: '$_id'},
                    pipeline: [
                        { $match: { $expr: { $and: [ {$eq: ['$userId','$$userId']}, { $eq: ['$isAccepted', true]}]}}}
                    ],
                    as: 'user_attendance'
                }
            },       
            {
                $unwind: { path: '$user_attendance'}
            },
            {
                $lookup: {
                    from: "events",
                    localField: "user_attendance.eventId",
                    foreignField: "_id",
                    as: 'events'
                }
            },
            {
                $unwind: { path: '$events'}
            },
            {
                $sort: {
                    'events.eventDate': -1
                }
            },
            {
                $project: {
                    'events': 1
                }
            }
        ])
        
        if (!events) {
            return res.status(404).json(error({ requestId: req.id, code: 404 }))
        }
    
        res
            .status(200)
            .json(success({
                requestId: req.id, 
                data: { events }
            }))
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
    }
})


/// for test use
router.post('/social/event/:id/attendance/', validateAccess, async (req, res) => {
    const eventId = req.params.id
    const attendance = new Users_Events_Attendance({
        ...req.body,
        userId: req.user.data._id,
        eventId: eventId
    })
    await attendance.save()
    res.send({attendance})
})

module.exports = router