const express = require('express');
const app = express();
const User = require('../../../db/models/User');
const UserFriend = require('../../../db/models/User_Friend');
const Event = require('../../../db/models/Event');
const UserEventAttendace = require('../../../db/models/User_Event_Attendance');
const Group = require('../../../db/models/Group');
const validateAccess = require('../../../middlewares/validateAccess');
const verifyToken = require('../../../middlewares/verifyToken');
const success = require('../../../utils/helpers/response').success;
const error = require('../../../utils/helpers/response').error;
const ObjectId = require('mongoose').Types.ObjectId;

//1. Fetch the invitations of type profile.
app.get('/social/invitations/profile', async (req, res) => {
    try {
        const userInfo = await User.findById(req.body.userId);
        if (userInfo) {
            sender = {
                "userId": userInfo._id
                , "firstName": userInfo.firstName
                , "lastName": userInfo.lastName
                , "profileImg": userInfo.profileImg
                , "coverPhoto": userInfo.coverPhoto
            }

            UserFriend.aggregate([
                {
                    $match:
                    {
                        $expr:
                        {
                            $eq: ["$userId", ObjectId(req.body.userId)]
                        }
                    }
                }
            ]).exec((e, invitations) => {
                console.log(e);
                if (e) {
                    res.status(500)
                        .json(error({
                            requestId: req.id,
                            code: 500,
                            message: e.message
                        }));
                }
                if (invitations.length === 0) {
                    res.status(404)
                        .json(error({
                            requestId: req.id,
                            code: 404,
                            message: `No invitations found for UserId ${req.body.userId}`
                        }));
                }
                else {
                    res.status(200)
                        .json(success({
                            requestId: req.id,
                            data: { sender, invitations }
                        }));
                }
            });
        }
        else {
            res.status(404)
                .json(error({
                    requestId: req.id,
                    code: 404,
                    message: `No user found ${req.body.userId}`
                }));
        }
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

//2. Create an invitation, if it does not exist
app.post('/social/new/invitation/profile', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;

        const senderExist = await User.findById(senderId);
        const receiverExist = await User.findById(receiverId);

        if (senderExist && receiverExist) {
            sender = {
                "userId": senderExist._id
                , "firstName": senderExist.firstName
                , "lastName": senderExist.lastName
                , "profileImg": senderExist.profileImg
                , "coverPhoto": senderExist.coverPhoto
            }

            UserFriend.aggregate([
                {
                    $match:
                    {
                        $expr:
                        {
                            $and:
                                [
                                    { $eq: ["$userId", ObjectId(senderId)] }
                                    , { $eq: ["$friendUserId", ObjectId(receiverId)] }
                                    , {
                                        $or:
                                            [
                                                { $eq: ["$statusRequest", "pending"] }
                                                , { $eq: ["$statusRequest", "accepted"] }
                                            ]
                                    }
                                ]
                        }
                    }
                }
            ]).exec((e, invitations) => {
                if (e) {
                    console.log(e);
                    res.status(500)
                        .json(error({
                            requestId: req.id,
                            code: 500,
                            message: e.message
                        }));
                }
                if (invitations.length !== 0) {
                    res.status(404)
                        .json(error({
                            requestId: req.id,
                            code: 404,
                            message: `Already exist the relation between Sender ${senderId} and Receiver ${receiverId}`
                        }));
                }
                else {
                    UserFriend.aggregate([
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$userId", ObjectId(receiverId)] }
                                            , { $eq: ["$friendUserId", ObjectId(senderId)] }
                                            , {
                                                $or:
                                                    [
                                                        { $eq: ["$statusRequest", "pending"] }
                                                        , { $eq: ["$statusRequest", "accepted"] }
                                                    ]
                                            }
                                        ]
                                }
                            }
                        }
                    ]).exec(async (e, invitations) => {
                        if (e) {
                            res.status(500)
                                .json(error({
                                    requestId: req.id,
                                    code: 500,
                                    message: e
                                }));
                        }
                        else if (invitations.length !== 0) {
                            const userInfo = await User.findById(receiverId);
                            if (userInfo) {
                                sender = {
                                    "userId": userInfo._id
                                    , "firstName": userInfo.firstName
                                    , "lastName": userInfo.lastName
                                    , "profileImg": userInfo.profileImg
                                    , "coverPhoto": userInfo.coverPhoto
                                }
                            }
                            else {
                                return res.status(404)
                                    .json(error({
                                        requestId: req.id,
                                        code: 404,
                                        message: `No relation found with Sender ${receiverId} and Receiver ${senderId}`
                                    }));
                            }

                            return res.status(401)
                                .json(error({
                                    requestId: req.id,
                                    code: 401,
                                    message: `Already exist the relation between Sender ${receiverId} and Receiver ${senderId}`
                                }));
                        }
                        else {
                            profileInvitation = new UserFriend({
                                userId: ObjectId(senderId)
                                , friendUserId: ObjectId(receiverId)
                                //, requestDate: new Date
                                , acceptedDate: null
                                , rejectedDate: null
                                , statusRequest: "pending"
                            });

                            await profileInvitation.save()
                                .then(data => {
                                    UserFriend.aggregate([
                                        {
                                            $match:
                                            {
                                                $expr:
                                                {
                                                    $and:
                                                        [
                                                            { $eq: ["$userId", ObjectId(senderId)] }
                                                            , { $eq: ["$friendUserId", ObjectId(receiverId)] }
                                                            , { $eq: ["$statusRequest", "pending"] }
                                                        ]
                                                }
                                            }
                                        }
                                    ]).exec((error, invitations) => {
                                        if (error) {
                                            res.status(500)
                                                .json(error({
                                                    requestId: req.id,
                                                    code: 500,
                                                    message: e.message
                                                }));
                                        }
                                        if (invitations.length === 0) {
                                            res.status(404)
                                                .json(error({
                                                    requestId: req.id,
                                                    code: 404,
                                                    message: `No relation found with Sender ${senderId} and Receiver ${receiverId}`
                                                }));
                                        }
                                        else {
                                            res.status(200)
                                                .json(success({
                                                    requestId: req.id,
                                                    data: { sender, invitations }
                                                }));
                                        }
                                    });
                                })
                                .catch(e => res.status(500)
                                    .json(error({
                                        requestId: req.id,
                                        code: 500,
                                        message: e.message
                                    })));
                        }
                    });
                }
            });
        }
        else {
            res.status(404)
                .json(error({
                    requestId: req.id,
                    code: 404,
                    message: `Information not found with Sender: ${senderId} and Receiver: ${receiverId}`
                }));
        }
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

//3. Accept or decline a friendship invitation
app.put('/social/invitations/profile/:id', async (req, res) => {
    try {
        //console.clear();
        const { userId, response } = req.body;

        //Find the friendship invitation
        const invitation = await UserFriend.findById(req.params.id);

        if (invitation) {
            if (invitation.statusRequest === "pending") {
                const userIdExist = await User.findById(userId);
                if (userIdExist) {
                    if (typeof response === 'undefined') {
                        res.status(500)
                            .json(error({
                                requestId: req.id,
                                code: 500,
                                message: `Missing parameter response response`
                            }));
                    }
                    else if (response && response !== true && response !== false) {
                        res.status(500)
                            .json(error({
                                requestId: req.id,
                                code: 500,
                                message: `Wrong parameter response ${response}`
                            }));
                    }
                    else {
                        const query = { _id: req.params.id };
                        const update = {
                            statusRequest: response ? "accepted" : "rejected"
                            , acceptedDate: response ? new Date : null
                            , rejectedDate: response ? null : new Date
                        };

                        await UserFriend.updateOne(
                            query,
                            update,
                            async function (e, result) {
                                console.log(e);
                                if (e) {
                                    res.status(500)
                                        .json(error({
                                            requestId: req.id,
                                            code: 500,
                                            message: e
                                        }));
                                }
                                else {
                                    const invitation = await UserFriend.findById(req.params.id);
                                    if (invitation) {
                                        res.status(500)
                                            .json(success({
                                                requestId: req.id,
                                                data: invitation
                                            }));
                                    }
                                    else {
                                        res.status(400)
                                            .json(error({
                                                requestId: req.id,
                                                code: 400,
                                                message: `No data found with invitation Id ${req.params.id}`
                                            }));
                                    }
                                }
                            }
                        )
                    }
                }
                else {
                    res.status(400)
                        .json(error({
                            requestId: req.id,
                            code: 400,
                            message: `User Id ${userId} doesn't exist`
                        }));
                }
            }
            else {
                res.status(403)
                    .json(error({
                        requestId: req.id,
                        code: 403,
                        message: `Friendship request already ${invitation.statusRequest}`
                    }));
            }
        }
        else {
            res.status(404)
                .json(error({
                    requestId: req.id,
                    code: 404,
                    message: `No data found with invitation Id ${req.params.id}`
                }));
        }
    } catch (error) {
        console.log(e);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e.message
            }));
    }
});

//4. Create's a new invitation for a specific event it can be user or group.
app.post('/social/new/invitation/event/:id', async (req, res) => {
    try {
        const { userId, groupId, typeR } = req.body;

        if (typeof typeR === 'undefined') {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Missing parameter typeR`
                }));
        }
        else if (typeR && typeR !== 'profile' && typeR !== 'group') {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Wrong parameter Type ${typeR}`
                }));
        }
        else if (typeR === 'group') {
            if (typeof groupId === 'undefined' || groupId === null) {
                res.status(500)
                    .json(error({
                        requestId: req.id,
                        code: 500,
                        message: `Missing parameter groupId`
                    }));
            }
        }
        else if (typeof userId === 'undefined' || userId === null) {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Missing parameter UserId`
                }));
        }

        const eventExist = await Event.findById(req.params.id);
        if (eventExist) {
            if (new String(eventExist.privacySettings).toLowerCase() === "public") {
                if (typeR === 'group') {
                    const groupExist = await Group.findById(groupId);
                    if (!groupExist) {
                        res.status(404)
                            .json(error({
                                requestId: req.id,
                                code: 404,
                                message: `Group with ID ${groupId} doesn't exist`
                            }));
                    }
                }
                else {
                    const userExist = await User.findById(userId);
                    if (!userExist) {
                        res.status(404)
                            .json(error({
                                requestId: req.id,
                                code: 404,
                                message: `User with ID ${userId} doesn't exist`
                            }));
                    }
                }

                if (typeR === 'profile') {
                    existEvent = await UserEventAttendace.aggregate([
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$userId", ObjectId(userId)] }
                                            , { $eq: ["$eventId", ObjectId(req.params.id)] }
                                        ]
                                }
                            }
                        }
                    ]).exec((e, result) => {
                        if (e) {
                            res.status(500)
                                .json(error({
                                    requestId: req.id,
                                    code: 500,
                                    message: e
                                }));
                        }
                        if (result.length !== 0) {
                            res.status(500)
                                .json(error({
                                    requestId: req.id,
                                    code: 500,
                                    message: "User event attendance already exist"
                                }));
                        }
                        else {
                            EventAttendance = new UserEventAttendace({
                                userId: typeR === 'profile' ? ObjectId(userId) : null,
                                eventId: req.params.id,
                                groupId: typeR === 'group' ? ObjectId(groupId) : null,
                                isInvited: true,
                                isAccepted: false,
                                dateAccepted: new Date
                            });

                            EventAttendance.save()
                                .then(data => res.status(200)
                                    .json(success({
                                        requestId: req.id,
                                        data: EventAttendance
                                    })))
                                .catch(e => res.status(500)
                                    .json(error({
                                        requestId: req.id,
                                        code: 500,
                                        message: e.message
                                    })));
                        }
                    });
                }
                else {
                    existEvent = await UserEventAttendace.aggregate([
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $and:
                                        [
                                            { $eq: ["$eventId", ObjectId(req.params.id)] }
                                            , { $eq: ["$groupId", ObjectId(groupId)] }
                                        ]
                                }
                            }
                        }
                    ]).exec((e, result) => {
                        console.log(result);
                        if (e) {
                            res.status(500)
                                .json(error({
                                    requestId: req.id,
                                    code: 500,
                                    message: e
                                }));
                        }
                        if (result.length !== 0) {
                            res.status(500)
                                .json(error({
                                    requestId: req.id,
                                    code: 500,
                                    message: "Group event attendance already exist"
                                }));
                        }
                        else {
                            EventAttendance = new UserEventAttendace({
                                userId: typeR === 'profile' ? ObjectId(userId) : null,
                                eventId: req.params.id,
                                groupId: typeR === 'group' ? ObjectId(groupId) : null,
                                isInvited: true,
                                isAccepted: false,
                                dateAccepted: new Date
                            });

                            EventAttendance.save()
                                .then(data => res.status(200)
                                    .json(success({
                                        requestId: req.id,
                                        data: EventAttendance
                                    })))
                                .catch(e => res.status(500)
                                    .json(error({
                                        requestId: req.id,
                                        code: 500,
                                        message: e.message
                                    })));
                        }
                    });
                }
            }
            else {
                res.status(403)
                    .json(error({
                        requestId: req.id,
                        code: 403,
                        message: `Event with ID ${req.params.id} is private`
                    }));
            }
        }
        else {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Event no found with ID ${req.params.id}`
                }));
        }
    } catch (e) {
        console.log(error);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e
            }));
    }
});


//4.1 Create's a new invitation for a specific event it can be user or group.
app.post('/social/new/invitation/event/temp/:id', async (req, res) => {
    try {
        const { userId, groupId, typeR } = req.body;

        if (typeof typeR === 'undefined') {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Missing parameter typeR`
                }));
        }
        else if (typeR && typeR !== 'profile' && typeR !== 'group') {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Wrong parameter Type ${typeR}`
                }));
        }
        else if (typeR === 'group') {
            if (typeof groupId === 'undefined' || groupId === null) {
                res.status(500)
                    .json(error({
                        requestId: req.id,
                        code: 500,
                        message: `Missing parameter groupId`
                    }));
            }
        }
        else if (typeof userId === 'undefined' || userId === null) {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Missing parameter UserId`
                }));
        }

        const eventExist = await Event.findById(req.params.id);
        if (eventExist) {
            if (new String(eventExist.privacySettings).toLowerCase() === "public") {
                if (typeR === 'group') {
                    const groupExist = await Group.findById(groupId);
                    if (!groupExist) {
                        res.status(404)
                            .json(error({
                                requestId: req.id,
                                code: 404,
                                message: `Group with ID ${groupId} doesn't exist`
                            }));
                    }
                }
                else {
                    const userExist = await User.findById(userId);
                    if (!userExist) {
                        res.status(404)
                            .json(error({
                                requestId: req.id,
                                code: 404,
                                message: `User with ID ${userId} doesn't exist`
                            }));
                    }
                }

                //there isn't difference if the request is profile or group type
                //if the request is a group type, the userId is going to be the group's owner
                existEvent = await UserEventAttendace.aggregate([
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                    [
                                        { $eq: ["$userId", ObjectId(userId)] }
                                        , { $eq: ["$eventId", ObjectId(req.params.id)] }
                                    ]
                            }
                        }
                    }
                ]).exec((e, result) => {
                    if (e) {
                        res.status(500)
                            .json(error({
                                requestId: req.id,
                                code: 500,
                                message: e
                            }));
                    }
                    if (result.length !== 0) {
                        res.status(500)
                            .json(error({
                                requestId: req.id,
                                code: 500,
                                message: "User event already exist"
                            }));
                    }
                    else {
                        EventAttendance = new UserEventAttendace({
                            userId: ObjectId(userId),
                            eventId: req.params.id,
                            groupId: typeR === 'group' ? ObjectId(groupId) : null,
                            isInvited: true,
                            isAccepted: false,
                            dateAccepted: new Date
                        });

                        EventAttendance.save()
                            .then(data => res.status(200)
                                .json(success({
                                    requestId: req.id,
                                    data: EventAttendance
                                })))
                            .catch(e => res.status(500)
                                .json(error({
                                    requestId: req.id,
                                    code: 500,
                                    message: e.message
                                })));
                    }
                });
            }
            else {
                res.status(403)
                    .json(error({
                        requestId: req.id,
                        code: 403,
                        message: `Event with ID ${req.params.id} is private`
                    }));
            }
        }
        else {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: `Event no found with ID ${req.params.id}`
                }));
        }
    } catch (e) {
        console.log(error);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e
            }));
    }
});

//5. Get a list of invitations of type event
app.get('/social/invitation/event', async (req, res) => {
    try {
        const events = await UserEventAttendace.find({ userId: ObjectId(req.body.userId) });
        if (events.length > 0) {
            res.status(200)
                .json(success({
                    requestId: req.id,
                    data: events
                }));
        }
        else {
            res.status(403)
                .json(error({
                    requestId: req.id,
                    code: 403,
                    message: `There is not events for user with ID ${req.body.userId}`
                }));
        }
    } catch (e) {
        console.log(error);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e
            }));
    }
});

//6. Get a list of invitations of type group
app.get('/social/invitations/group', async (req, res) => {
    try {
        Group.aggregate([
            { $unwind: "$userMembers" },
            {
                $match:
                {
                    $expr:
                    {
                        $and:
                            [
                                { $eq: ["$userMembers.userId", ObjectId(req.body.userId)] },
                                { $eq: ["$userMembers.status", "pending"] }
                            ]
                    }
                }
            },
            {
                $group:
                {
                    _id: null,
                    groupIds: {
                        $push: "$_id"
                    }
                }
            },
            {
                $project:
                {
                    _id: 0,
                    groupIds: 1
                }
            },
            {
                $lookup:
                {
                    from: "groups",
                    let: { tempGroupIds: "$groupIds" },
                    pipeline: [
                        {
                            $match:
                            {
                                $expr:
                                {
                                    $in: ["$_id", "$$tempGroupIds"]
                                }
                            }
                        }
                    ],
                    as: "groupsInvitations"
                }
            },
            {
                $project:
                {
                    groupsInvitations: 1
                }
            }
        ]).exec((e, result) => {
            if (e) {
                console.log(error);
                res.status(500)
                    .json(error({
                        requestId: req.id,
                        code: 500,
                        message: e
                    }));
            }
            else if (result.length === 0) {
                res.status(404)
                    .json(error({
                        requestId: req.id,
                        code: 404,
                        message: `No data found for user with ID ${req.body.userId}`
                    }));
            }
            else {
                info = result.pop();
                res.status(200)
                    .json(success({
                        requestId: req.id,
                        data: info
                    }))
            }
        });
    } catch (e) {
        console.log(error);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e
            }));
    }
});

module.exports = app