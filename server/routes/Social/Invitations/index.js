const express = require('express');
const app = express();
const User = require('../../../db/models/User');
const UserFriend = require('../../../db/models/User_Friend');
const Event = require('../../../db/models/Event');
const UserEventAttendace = require('../../../db/models/User_Event_Attendance');
const Group = require('../../../db/models/Group');
const validateAccess = require('../../../middlewares/validateAccess');
const verifyToken = require('../../../middlewares/verifyToken');
const {success} = require('../../../utils/helpers/response');
const {error} = require('../../../utils/helpers/response');
const {ObjectId} = require('mongoose').Types;
const validator = require('validator');


//1. Fetch the invitations of type profile.
app.get('/social/invitations/profile',[validateAccess,verifyToken], async (req, res) => {
    try {

        const { userId } = req.body;

        if (!validator.isMongoId(userId)) {
            return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter UserId` }));
        }

        const userInfo = await User.findById(req.body.userId);
        if (userInfo) {
            sender = {
                "userId": userInfo._id
                , "firstName": userInfo.firstName
                , "lastName": userInfo.lastName
                , "profileImg": userInfo.profileImg
                , "coverPhoto": userInfo.coverPhoto
            };

            UserFriend.aggregate([{ $match: { $expr: { $eq: ["$userId", ObjectId(userId)] } } }
            ]).exec((e, invitations) => {
                if (e) {
                    res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
                }
                if (invitations.length === 0) {
                    res.status(404).json(error({ requestId: req.id, code: 404, message: `No invitations found for UserId ${req.body.userId}` }));
                }
                else {
                    res.status(200).json(success({ requestId: req.id, data: { sender, invitations } }));
                }
            });
        }
        else {
            res.status(404).json(error({ requestId: req.id, code: 404, message: `No user found ${req.body.userId}` }));
        }
    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
    }
});


//2. Create an invitation, if it does not exist
app.post('/social/new/invitation/profile', async (req, res) => {
    try {

        const { senderId, receiverId } = req.body;

        if (!validator.isMongoId(senderId)) {
            return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter senderId` }));
        }
        if (!validator.isMongoId(receiverId)) {
            return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter receiverId` }));
        }

        const senderExist = await User.findById(senderId);
        const receiverExist = await User.findById(receiverId);

        if (senderExist && receiverExist) {
            const existRequest = new Promise((resolve, reject) => {
                UserFriend.aggregate([
                    {
                        $match:
                        {
                            $expr:
                            {
                                $or:
                                    [
                                        {
                                            $and:
                                                [
                                                    { $eq: ["$userId", ObjectId(senderId)] },
                                                    { $eq: ["$friendUserId", ObjectId(receiverId)] },
                                                    { $or: [{ $eq: ["$statusRequest", "pending"] }, { $eq: ["$statusRequest", "accepted"] }] }
                                                ]
                                        },
                                        {
                                            $and:
                                                [
                                                    { $eq: ["$userId", ObjectId(receiverId)] },
                                                    { $eq: ["$friendUserId", ObjectId(senderId)] },
                                                    { $or: [{ $eq: ["$statusRequest", "pending"] }, { $eq: ["$statusRequest", "accepted"] }] }
                                                ]
                                        }
                                    ]
                            }
                        }
                    }
                ]).exec((e, result) => {
                    if (e) reject(e ? e : e.message);
                    if (result.length !== 0) reject(`Already exist the relation between Sender ${senderId} and Receiver ${receiverId}`);
                    resolve(result);
                });
            });

            existRequest
                .then(data => {
                    profileInvitation = new UserFriend({
                        userId: ObjectId(senderId)
                        , friendUserId: ObjectId(receiverId)
                        , acceptedDate: null
                        , rejectedDate: null
                    });

                    sender = {
                        "userId": senderExist._id
                        , "firstName": senderExist.firstName
                        , "lastName": senderExist.lastName
                        , "profileImg": senderExist.profileImg
                        , "coverPhoto": senderExist.coverPhoto
                    };
                    receiver = {
                        "userId": receiverExist._id
                        , "firstName": receiverExist.firstName
                        , "lastName": receiverExist.lastName
                        , "profileImg": receiverExist.profileImg
                        , "coverPhoto": receiverExist.coverPhoto
                    };

                    profileInvitation.save();
                    res.status(200).json(success({ requestId: req.id, data: {sender, receiver,profileInvitation} }));
                })
                .catch(e => { res.status(500).json(error({ requestId: req.id, code: 500, message: e })); });
        }
        else {
            res.status(404).json(error({ requestId: req.id, code: 404, message: `Information not found with Sender: ${senderId} and Receiver: ${receiverId}` }));
        }
    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
    }
});


//3. Accept or decline a friendship invitation
app.put('/social/invitations/profile/:id',[validateAccess, verifyToken], async (req, res) => {
    try {
        const { userId, response } = req.body;

        //Find the friendship invitation
        const invitation = await UserFriend.findById(req.params.id);

        if (invitation) {
            if (invitation.statusRequest === "pending") {
                if (!validator.isMongoId(userId)) {
                    return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter userId` }));
                }

                const userIdExist = await User.findById(userId);
                if (userIdExist) {
                    invitation.statusRequest = response ? "accepted" : "rejected";
                    invitation.acceptedDate = response ? Date.now() : null;
                    invitation.rejectedDate = response ? null : Date.now();

                    await invitation.save();
                    res.status(200).json(success({ requestId: req.id, data: invitation }));
                }
                else {
                    res.status(400).json(error({ requestId: req.id, code: 400, message: `User Id ${userId} doesn't exist` }));
                }
            }
            else {
                res.status(403).json(error({ requestId: req.id, code: 403, message: `Friendship request already exist ${invitation.statusRequest}` }));
            }
        }
        else {
            res.status(404).json(error({ requestId: req.id, code: 404, message: `No data found with invitation Id ${req.params.id}` }));
        }
    } catch (error) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
    }
});


//4. Create's a new invitation for a specific event it can be profile or group.
app.post('/social/new/invitation/event/:id', [validateAccess,verifyToken], async (req, res) => {
    try {
        const { userId, groupId, typeR } = req.body;

        if (!typeR) {
            return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter typeR` }));
        }
        else if (typeR === 'group') {
            if (!validator.isMongoId(groupId)) {
                return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter groupId` }));
            }
        }
        else if (!validator.isMongoId(userId)) {
            return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter UserId` }));
        }

        const eventExist = await Event.findById(req.params.id);
        if (eventExist) {
            if (new String(eventExist.privacySettings).toLowerCase() === "public") {
                const validateIds = new Promise(async (resolve, reject) => {
                    if (typeR === 'group') {
                        const groupExist = await Group.findById(groupId);
                        if (!groupExist) {
                            reject(`Group with ID ${groupId} doesn't exist`);
                        }
                        isType = false;
                    }
                    else {
                        const userExist = await User.findById(userId);
                        if (!userExist) {
                            reject(`User with ID ${userId} doesn't exist`);
                        }
                        isType = true;
                    }
                    resolve(isType);
                });

                validateIds
                    .then(result => {
                        const existEvent = new Promise((resolve, reject) => {
                            if (result) {
                                UserEventAttendace.aggregate([{ $match: { $expr: { $and: [{ $eq: ["$userId", ObjectId(userId)] }, { $eq: ["$eventId", ObjectId(req.params.id)] }] } } }
                                ]).exec((e, result) => {
                                    if (e) reject(e);
                                    if (result.length !== 0) reject(`User event attendance already exist`);
                                    resolve(isType);
                                });
                            }
                            else {
                                UserEventAttendace.aggregate([{ $match: { $expr: { $and: [{ $eq: ["$eventId", ObjectId(req.params.id)] }, { $eq: ["$groupId", ObjectId(groupId)] }] } } }
                                ]).exec((e, result) => {
                                    if (e) reject(e);
                                    if (result.length !== 0) reject(`Group event attendance already exist`);
                                    resolve(isType);
                                });
                            }
                        });

                        existEvent
                            .then(result => {
                                EventAttendance = new UserEventAttendace({
                                    userId: result ? ObjectId(userId) : null,
                                    eventId: req.params.id,
                                    groupId: !result ? ObjectId(groupId) : null,
                                    isInvited: true,
                                    isAccepted: false,
                                    dateAccepted: Date.now()
                                });

                                EventAttendance.save()
                                    .then(data => res.status(200).json(success({ requestId: req.id, data: EventAttendance })))
                                    .catch(e => res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message })));
                            })
                            .catch(e => {
                                res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
                            });

                    })
                    .catch(e => {
                        res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
                    });
            }
            else {
                res.status(403).json(error({ requestId: req.id, code: 403, message: `Event with ID ${req.params.id} is private` }));
            }
        }
        else {
            res.status(404).json(error({ requestId: req.id, code: 404, message: `Event no found with ID ${req.params.id}` }));
        }
    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
    }
});


//5. Get a list of invitations of type event
app.get('/social/invitation/event', [validateAccess,verifyToken], async (req, res) => {
    try {

        const { userId } = req.body;
        if (!validator.isMongoId(userId)) {
            return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or empty parameter userId` }));
        }

        const events = await UserEventAttendace.find(userId);
        if (events.length > 0) {
            res.status(200).json(success({ requestId: req.id, data: events }));
        }
        else {
            res.status(403).json(error({ requestId: req.id, code: 403, message: `There is not events for user with ID ${req.body.userId}` }));
        }
    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
    }
});


//6. Get a list of invitations of type group
app.get('/social/invitations/group', [validateAccess, verifyToken], async (req, res) => {
    try {
        const { userId } = req.body;
        if (!validator.isMongoId(userId)) {
            return res.status(500).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter userId` }));
        }

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
                res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
            }
            else if (result.length === 0) {
                res.status(404).json(error({ requestId: req.id, code: 404, message: `No data found for user with ID ${req.body.userId}` }));
            }
            else {
                info = result.pop();
                res.status(200).json(success({ requestId: req.id, data: info }));
            }
        });
    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e ? e : e.message }));
    }
});

module.exports = app;