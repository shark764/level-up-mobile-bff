const express = require('express');
const app = express();
const User = require('../../../db/models/User');
const Group = require('../../../db/models/Group');
const UserFriend = require('../../../db/models/User_Friend');
const UserEventAttendace = require('../../../db/models/User_Event_Attendance');
const validateAccess = require('../../../middlewares/validateAccess');
const verifyToken = require('../../../middlewares/verifyToken');
const ObjectId = require('mongoose').Types.ObjectId;
const { getAllGroupInfo } = require('../Helper');
const success = require('../../../utils/helpers/response').success;
const error = require('../../../utils/helpers/response').error;

//3. Groups that the current user does/doesn't belong
app.get('/social/groups/:userId', [validateAccess,verifyToken],async (req, res) => {
    try {
        //Get the userId
        const { userId } = req.params;
        const { q } = req.query; //true or false in order to show groups

        showUserGroup = false;
        if (!(typeof q === 'undefined')) {
            if (q && q === 'true') {
                showUserGroup = true;
            }
            else {
                if (!(q && q === 'false')) {
                    res.status(400)
                        .json(error({
                            requestId: req.id,
                            code: 400,
                            message: `Wrong query input received ${q}`
                        }));
                }
            }
        }

        //true, fetch the groups in which the current user belong
        //false, fetch the groups in which the current user doesn't belong
        if (showUserGroup) {
            await User.findUserInGroups(userId)
                .then(groups => res.status(200)
                    .json(success({
                        requestId: req.id,
                        data: groups
                    })))
                .catch(e => res.status(400)
                    .json(error({
                        requestId: req.id,
                        code: 400,
                        message: e.message
                    })))
        }
        else {
            await User.findUserNotInGroups(userId)
                .then(groups => res.status(200)
                    .json(success({
                        requestId: req.id,
                        data: groups
                    })))
                .catch(e => res.status(400)
                    .json(error({
                        requestId: req.id,
                        code: 400,
                        message: e.message
                    })))
        }

    } catch (error) {
        console.log(error);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e.message
            }));
    }
})


//4. Groups of the user's friends in which the current user is not in.
app.get('/social/friends/groups/:userId',[validateAccess,verifyToken], async (req, res) => {
    try {
        //Get the id
        const { userId } = req.params;

        //Fetch the groups in which the user not in
        await User.myFriendsGroups(userId)
            .then(friendsGroups => res.status(200)
                .json(success({
                    requestId: req.id,
                    data: friendsGroups
                })))
            .catch(e => res.status(400)
                .json(error({
                    requestId: req.id,
                    code: 400,
                    message: e.message
                })))
    } catch (error) {
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e.message
            }));
    }
})


//5. Get a specific group with members, posts and events if member
app.get('/social/group/:id',async (req, res) => {
    try {
        //Get the parameters
        const { id } = req.params;
        const { q } = req.query;

        if (typeof q === 'undefined' || q === "") {
            return res.json({ success: false, error: `Missing parameter in query` })
        }

        //By default the info wont be displayed
        showAllInfo = false;

        //If the user is member, the full information will be displayed
        const groupConf = await Group.findById(id);
        if (groupConf) {
            if (groupConf.privacySettings === 'public') {
                showAllInfo = true;
            }
            else {
                await User.findUserInGroup(id, q, true)
                    .then((data) => {
                        if (data.length !== 0) {
                            if (data.userMembers.isAdmin) {
                                showAllInfo = true
                            }
                        }
                    })
                    .catch(e => res.status(400)
                        .json(error({
                            requestId: req.id,
                            code: 400,
                            message: e.message
                        })));
            }

            await getAllGroupInfo(id, showAllInfo)
                .then(infoGroup => res.status(200)
                    .json(success({
                        requestId: req.id,
                        data: infoGroup
                    })))
                .catch(e => res.status(404)
                    .json(error({
                        requestId: req.id,
                        code: 404,
                        message: e.message
                    })));
        }
        else {
            res.status(400)
                .json(error({
                    requestId: req.id,
                    code: 400,
                    message: `No data found for Group ${id}`
                }));
        }
    } catch (e) {
        console.log('error general');
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e.message
            }));
    }
})


//6. Edit the group
app.put('/social/group/:id', async (req, res) => {
    try {
        //Fetch the parameteres
        const id = req.params.id;

        //Validate the group, user and permission to modify
        await User.userIsAdmin(id, req.body.userId);

        //Get the values to update
        const tempMembers = await Promise.all(req.body.administrators.map(async (item) => {

            //if the user is equal to the owner is not going to be added
            if (item !== req.body.userId) {
                //validate if the user exist like a member administrator
                return itemAdd = await User.findUserInGroup(id, item, true)
                    .then(data => {
                        if (data.length === 0) {
                            return {
                                "userId": ObjectId(item),
                                "isAdmin": true,
                                "status": "accepted",
                                "dateAccepted": new Date
                            }
                        }
                    })
                    .catch(e => res.status(500)
                        .json(error({
                            requestId: req.id,
                            code: 500,
                            message: e
                        })));
            }
        }));

        userMembers = tempMembers.filter(item => item);

        const queryGroup = { _id: ObjectId(req.params.id) }
        const updateGroup = {
            groupName: req.body.groupName
            , description: req.body.description
            , coverPhoto: req.body.coverPhoto
            , privacySettings: req.body.privacySettings
            , status: req.body.status
            , $addToSet: {
                userMembers
            }
        }

        //Update the collection
        await Group.updateOne(queryGroup,
            updateGroup,
            async function (e, doc) {
                if (e) {
                    res.status(500)
                        .json(error({
                            requestId: req.id,
                            code: 500,
                            message: e
                        }));
                }
                else {
                    await getAllGroupInfo(id, true)
                        .then(infoGroup => res.status(200)
                            .json(success({
                                requestId: req.id,
                                data: infoGroup
                            })))
                        .catch(e => res.status(404)
                            .json(error({
                                requestId: req.id,
                                code: 404,
                                message: e.message
                            })));
                }
            }
        )
    } catch (e) {
        console.log(e);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e
            }));
    }
})


//7. Create a new group
app.post('/social/new/group', async (req, res) => {
    try {

        //Validate if the user exist
        userExist = await User.findById(req.body.userId);

        if (userExist) {
            //Validate the group's name
            nameExist = await Group.findOne({ groupName: req.body.groupName });

            if (nameExist) {
                res.status(401)
                    .json(error({
                        requestId: req.id,
                        code: 401,
                        message: `The group name '${req.body.groupName}' already exist`
                    }));
            }
            else {
                //set the values
                group = new Group({
                    userId: ObjectId(req.body.userId),
                    groupName: req.body.groupName,
                    description: req.body.description,
                    coverPhoto: req.body.coverPhoto,
                    privacySettings: req.body.privacySettings,
                    status: req.body.status
                })

                await group.save()
                    .then(data => res.status(200)
                        .json(success({
                            requestId: req.id,
                            data: group
                        })))
                    .catch(e => res.status(500)
                        .json(error({
                            requestId: req.id,
                            code: 500,
                            message: e.message
                        })));
            }
        }
        else {
            res.status(404)
                .json(error({
                    requestId: req.id,
                    code: 404,
                    message: `User ${req.body.userId} doesn't exist`
                }));
        }

    } catch (error) {
        console.log(error);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e.message
            }));
    }
})

//8. Join to group if the group is public
app.post('/social/group/join/:id', async (req, res) => {
    try {
        //Validate if the user exist
        userExist = await User.findById(req.body.userId);
        if (userExist) {
            //Validate the group
            groupExist = await Group.findById(req.params.id);
            if (groupExist) {
                //Validate if user exist like a member
                await Group.aggregate([
                    { $unwind: {path: "$userMembers", preserveNullAndEmptyArrays: true }},
                    {
                        $match:
                        {
                            $expr:
                            {
                                $and:
                                    [
                                        { $eq: ["$_id", ObjectId(req.params.id)] },
                                        { $eq: ["$userMembers.userId", ObjectId(req.body.userId)] },
                                        {$ne :["$userMembers.status","rejected"] }
                                    ]
                            }
                        }
                    }
                ]).then((data) => {
                    if (data.length === 0) {
                        tempAccepted = "pending";
                        if (groupExist.privacySettings === "public") {
                            tempAccepted = "accepted"
                        }
                        const queryGroup = { _id: ObjectId(req.params.id) }
                        const updateGroup = {
                            $addToSet:
                            {
                                "userMembers":
                                {
                                    "userId": ObjectId(req.body.userId),
                                    "isAdmin": false,
                                    "status": tempAccepted,
                                    "dateAccepted": new Date
                                }
                            }
                        }

                        Group.updateOne(
                            queryGroup,
                            updateGroup,
                            async function (e, doc) {
                                if (e) {
                                    res.status(500)
                                        .json(error({
                                            requestId: req.id,
                                            code: 500,
                                            message: e.message
                                        }));
                                }
                                else {
                                    await getAllGroupInfo(req.params.id, (groupExist.privacySettings === 'public'))
                                        .then(infoGroup => res.status(200)
                                            .json(success({
                                                requestId: req.id,
                                                data: infoGroup
                                            })))
                                        .catch(e => res.status(404)
                                            .json(error({
                                                requestId: req.id,
                                                code: 500,
                                                message: e.message
                                            })));
                                }
                            }
                        )
                    }
                    else {
                        res.status(401)
                            .json(error({
                                requestId: req.id,
                                code: 401,
                                message: `User ${req.body.userId} already exist in the group`
                            }));
                    }
                })
                    .catch(e => res.status(404)
                        .json(error({
                            requestId: req.id,
                            code: 404,
                            message: e
                        })));
            }
            else {
                res.status(404)
                    .json(error({
                        requestId: req.id,
                        code: 404,
                        message: `Group ${req.params.id} doesn't exist`
                    }));
            }
        }
        else {
            res.status(404)
                .json(error({
                    requestId: req.id,
                    code: 404,
                    message: `User ${req.body.userId} doesn't exist`
                }));
        }
    } catch (error) {
        console.log(error);
        res.status(500)
            .json(error({
                requestId: req.id,
                code: 500,
                message: e.message
            }));
    }
})

//9. Unjoin an user from an specific group
app.delete('/social/group/unjoin/:id', async (req, res) => {

    try {
        await Group.aggregate([
            { $unwind: "$userMembers" },
            {
                $match:
                {
                    $expr:
                    {
                        $and:
                            [
                                { $eq: ["$_id", ObjectId(req.params.id)] },
                                { $eq: ["$userMembers.userId", ObjectId(req.body.userId)] }
                            ]
                    }
                }
            }
        ]).exec(async (e, data) => {
            if (e) {
                res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: e.message
                }));
            }
            else {
                if (data.length === 0){
                    res.status(404)
                    .json(error({
                        requestId: req.id,
                        code: 404,
                        message: `User ${req.params.id} doesn't exist`
                    }));
                } 
                else{
                    const ui = data.pop()
                    Group.updateOne(
                        { _id: ObjectId(req.params.id) },
                        { $pull: { "userMembers": { "userId": ObjectId(ui.userMembers.userId) } } },
                        async function (e, doc) {
                            if (e) {
                                console.log(e)
                                res.status(500)
                                .json(error({
                                    requestId: req.id,
                                    code: 500,
                                    message: e.message
                                }));
                            }
                            else{
                                await getAllGroupInfo(req.params.id, false)
                                .then((result) => {
                                    res.status(200)
                                    .json(success({
                                        requestId: req.id,
                                        data: result
                                    }));
                                })
                                .catch(e => {console.log(e),res.status(400)
                                    .json(error({
                                        requestId: req.id,
                                        code: 400,
                                        message: e
                                    }))});
                            }
                        }
                    );
                }
            }
        });
    } catch (error) {
        console.log(error);
        if (error) {
            res.status(500)
                .json(error({
                    requestId: req.id,
                    code: 500,
                    message: e.message
                }));
        }
    }

})

module.exports = app