const express = require('express');
const app = express();
const User = require('../../../db/models/User');
const Group = require('../../../db/models/Group');
const validateAccess = require('../../../middlewares/validateAccess');
const verifyToken = require('../../../middlewares/verifyToken');
const {ObjectId} = require('mongoose').Types;
const { getAllGroupInfo } = require('../Helper');
const {success} = require('../../../utils/helpers/response');
const {error} = require('../../../utils/helpers/response');
const validator = require('validator');

//3. Groups that the current user does/doesn't belong
app.get('/social/groups/:userId', [validateAccess, verifyToken], async (req, res) => {
    try {
        //Get the userId
        const { userId } = req.params;
        const { q } = req.query; //true or false in order to show groups

        const groupsProcess = new Promise((resolve, reject) => {
            if (!validator.isMongoId(userId)) {
                return reject(`Missing or wrong parameter userId`);
            }

            showUserGroup = false;
            if (q) {
                if (q === 'true') {
                    showUserGroup = true;
                }
                else if (!(q === 'false')) {
                    return reject(`Wrong query input received ${q}`);
                }
            }

            //true, fetch the groups in which the current user belong
            //false, fetch the groups in which the current user doesn't belong            
            if (showUserGroup) {
                User.findUserInGroups(userId)
                    .then(groups => resolve(groups))
                    .catch(e => reject(e));
            }
            else {
                User.findUserNotInGroups(userId)
                    .then(groups => resolve(groups))
                    .catch(e => reject(e));
            }
        });

        groupsProcess
            .then(groups => { res.status(200).json(success({ requestId: req.id, data: groups })); })
            .catch(e => { res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` })); });

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` }));
    }
});


//4. Groups of the user's friends in which the current user is not in.
app.get('/social/friends/groups/:userId', [validateAccess, verifyToken], async (req, res) => {
    try {
        //Get the id
        const { userId } = req.params;

        if (!validator.isMongoId(userId)) {
            return res.status(404).json(error({ requestId: req.id, code: 500, message: `Missing or wrong parameter userId` }));
        }

        //Fetch the groups in which the user not in
        await User.myFriendsGroups(userId)
            .then(friendsGroups => res.status(200).json(success({ requestId: req.id, data: friendsGroups })))
            .catch(e => res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` })));
    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` }));
    }
});


//5. Get a specific group with members, posts and events if member
app.get('/social/group/:groupId', [validateAccess, verifyToken], async (req, res) => {
    try {
        //Get the parameters
        const { groupId } = req.params;
        const { userId } = req.body;

        showAllInfo = false;
        const infoProcess = new Promise((resolve, reject) => {
            if (!validator.isMongoId(groupId)) {
                return reject(`Missing or wrong parameter groupId`);
            }

            if (!validator.isMongoId(userId)) {
                return reject(`Missing or wrong parameter userId`);
            }

            //If the user is member, the full information will be displayed
            const groupConf = Group.findById(groupId);
            groupConf
                .then(result => {
                    if (result) {
                        if (groupConf.privacySettings === 'public') {
                            showAllInfo = true;
                        }
                        else {
                            if (result.userId === userId) {
                                showAllInfo = true;
                            }
                            else {
                                const member = result.userMembers.filter(item => (item.userId.toString() === userId && item.status === "accepted"));

                                if (member.length !== 0) {
                                    getMember = member.pop();
                                    if (getMember.isAdmin) {
                                        showAllInfo = true;
                                    }
                                }
                            }
                        }

                        getAllGroupInfo(groupId, showAllInfo)
                            .then(infoGroup => resolve(infoGroup))
                            .catch(e => reject(e));
                    }
                    else {
                        reject(`No data found for Group ${groupId}`);
                    }
                })
                .catch(e => reject(e));
        });

        infoProcess
            .then(infoGroup => res.status(200).json(success({ requestId: req.id, data: infoGroup })))
            .catch(e => res.status(404).json(error({ requestId: req.id, code: 404, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` })));

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` }));
    }
});


//6. Edit the group
app.put('/social/group/:groupId', [validateAccess, verifyToken], async (req, res) => {
    try {

        //Fetch the parameteres
        const { groupId } = req.params;
        const { userId, groupName, description, privacySettings, coverPhoto, status, administrators } = req.body;

        const editResult = new Promise((resolve, reject) => {

            if (!validator.isMongoId(groupId) || !validator.isMongoId(userId) || !groupName || !description || !privacySettings ||
                (privacySettings !== 'public' && privacySettings !== 'private') || !coverPhoto || !status || !administrators) {
                return reject(`Missing or wrong parameter please check the payload`);
            }

            const groupExist = Group.findById(groupId);
            groupExist
                .then(getGroup => {
                    if (getGroup) {
                        const isAdminUser = User.userIsAdmin(groupId, userId);
                        isAdminUser
                            .then(infoGroup => {
                                objAdministrators = administrators.map(item => ObjectId(item));
                                Group.aggregate([
                                    { $unwind: "$userMembers" },
                                    { $match: { $expr: { $and: [{ $eq: ["$_id", ObjectId(groupId)] }, { $in: ["$userMembers.userId", objAdministrators] }] } } }
                                ]).exec((e, result) => {
                                    if (e) 
                                        return reject(e);
                                    if (result.length === 0) {
                                        newAdmins = administrators.map((item) => ({
                                                "userId": ObjectId(item),
                                                "isAdmin": true,
                                                "status": "accepted",
                                                "dateAccepted": Date.now()
                                            }));

                                        getGroup.groupName = groupName;
                                        getGroup.description = description;
                                        getGroup.coverPhoto = coverPhoto;
                                        getGroup.privacySettings = privacySettings;
                                        getGroup.status = status;
                                        newAdmins.map(item => getGroup.userMembers.push(item));

                                        resolve(getGroup.save());
                                    }
                                    else {
                                        reject(`Administrator Id already exist like a Admin User Member, please check the payload`);
                                    }
                                });
                            })
                            .catch(e => reject(e));
                    }
                    else {
                        reject(`Group with Id ${groupId} doesn't exist`);
                    }
                })
                .catch(e => reject(e));
        });

        editResult
            .then(infoGroup => res.status(200).json(success({ requestId: req.id, data: infoGroup })))
            .catch(e => res.status(404).json(error({ requestId: req.id, code: 404, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` })));
    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` }));
    }
});


//7. Create a new group
app.post('/social/new/group', [validateAccess, verifyToken],async (req, res) => {
    try {

        const { userId, groupName, description, privacySettings, coverPhoto, status } = req.body;

        const groupProcess = new Promise((resolve, reject) => {
            if (!validator.isMongoId(userId) || !groupName || !description || !privacySettings ||
                (privacySettings !== 'public' && privacySettings !== 'private') || !coverPhoto || !status) {
                return reject(`Missing or wrong parameter please check the payload`);
            }

            const userExist = User.findById(userId);
            userExist
                .then(result => {
                    if (result) {
                        const nameExist = Group.findOne({ groupName });
                        nameExist
                            .then(result => {
                                if (result) {
                                    return reject(`The group name '${groupName}' already exist`);
                                }

                                group = new Group({
                                    userId: ObjectId(req.body.userId),
                                    groupName,
                                    description,
                                    coverPhoto,
                                    privacySettings,
                                    status
                                });

                                resolve(group.save());
                            })
                            .catch(e => reject(e));
                    }
                    else {
                        reject(`User ${userId} doesn't exist`);
                    }
                })
                .catch(e => reject(e));
        });

        groupProcess
            .then(group => res.status(200).json(success({ requestId: req.id, data: group })))
            .catch(e => res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` })));

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` }));
    }
});

//8. Join to group if the group is public
app.post('/social/group/join/:id', [validateAccess, verifyToken], async (req, res) => {
    try {

        const { userId } = req.body;

        const joiningProcess = new Promise((resolve, reject) => {
            if (!validator.isMongoId(userId)) {
                return reject(`Missing or wrong parameter UserId`);
            }

            userExist = User.findById(userId);
            userExist
                .then(result => {
                    if (result) {
                        groupExist = Group.findById(req.params.id);
                        groupExist
                            .then(result => {
                                if (result) {
                                    const member = result.userMembers.filter(item => (item.userId.toString() === userId && item.status !== "rejected"));

                                    if (member.length === 0) {
                                        tempAccepted = "pending";
                                        if (result.privacySettings === "public") {
                                            tempAccepted = "accepted";
                                        }

                                        const newMember = {
                                            "userId": ObjectId(userId),
                                            "isAdmin": false,
                                            "status": tempAccepted,
                                            "dateAccepted": Date.now()
                                        };

                                        result.userMembers.push(newMember);
                                        resolve(result.save());
                                    }
                                    else {
                                        reject(`User ${userId} already exist in the group`);
                                    }
                                }
                                else {
                                    reject(`Group ${req.params.id} doesn't exist`);
                                }
                            })
                            .catch(e => reject(e));
                    }
                    else {
                        reject(`User ${userId} doesn't exist`);
                    }
                })
                .catch(e => reject(e));
        });

        joiningProcess
            .then(infoGroup => res.status(200).json(success({ requestId: req.id, data: infoGroup })))
            .catch(e => res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` })));

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` }));
    }
});

//9. Unjoin an user from an specific group
app.delete('/social/group/unjoin/:id', [validateAccess,verifyToken], async (req, res) => {
    try {

        const { userId } = req.body;

        const unjoiningProcess = new Promise((resolve, reject) => {
            if (!validator.isMongoId(userId)) {
                return reject(`Missing or empty parameter UserId`);
            }

            Group.aggregate([
                { $unwind: "$userMembers" },
                { $match: { $expr: { $and: [{ $eq: ["$_id", ObjectId(req.params.id)] }, { $eq: ["$userMembers.userId", ObjectId(userId)] }] } } }
            ]).exec(async (e, data) => {
                if (e) return reject(e);
                if (data.length === 0) return reject(`User ${userId} doesn't exist into the group`);

                const ui = data.pop();
                Group.updateOne(
                    { _id: ObjectId(req.params.id) },
                    { $pull: { "userMembers": { "userId": ObjectId(ui.userMembers.userId) } } },
                    async (e, group) => {
                        if (e) reject(e);
                        resolve({ memberUnjoined: ui.userMembers });
                    }
                );
            });
        });

        unjoiningProcess
            .then(infoGroup => res.status(200).json(success({ requestId: req.id, data: infoGroup })))
            .catch(e => res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` })));

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: `Error: ${e} ${e.message ? `Detail: ${e.message}` : ""}` }));
    }
});

module.exports = app;