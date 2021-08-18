const express = require('express');
const app = express();
const GoalCategory = require('../../db/models/Goal_Category');
const UserFacility = require('../../db/models/User_Facility');
const UserGoal = require('../../db/models/User_Goal');
const Goal = require('../../db/models/Goal');
const User = require('../../db/models/User');
const Facility = require('../../db/models/Facility');
const UserFriend = require('../../db/models/User_Friend');
const { ObjectId } = require('mongoose').Types;
const { error, success } = require('../../utils/helpers/response');
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');
const validator = require('validator');


app.get('/goals/categories',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    async (req, res) => {
        try {
            const goalCategories = await GoalCategory.find({});
            res.json(success({ requestId: req.id, data: { categories: goalCategories } }));
        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
        }
    });


app.get('/goals/categories/:goalCategoryId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        try {
            const { goalCategoryId } = req.params;
            const { facilityId } = req.body;
            const userId = req.user_id;

            if (!validator.isMongoId(goalCategoryId) || !validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {

                const userFacilityExist = UserFacility.find({ userId, facilityId });

                userFacilityExist
                    .then(userFacilities => {
                        if (userFacilities.length > 0) {
                            const userFacility = userFacilities.pop();
                            const userGoalsExists = UserGoal.find({ userFacilityId: userFacility });

                            userGoalsExists
                                .then(userGoals => {
                                    if (userGoals.length > 0) {
                                        Goal.aggregate([
                                            {
                                                "$match": { "goalCategoryId": ObjectId(goalCategoryId) }
                                            },
                                            {
                                                "$redact": {
                                                    "$cond": {
                                                        "if": { "$in": ["$_id", userGoals.map(({ goalId }) => ObjectId(goalId))] },
                                                        "then": "$$PRUNE",
                                                        "else": "$$DESCEND"
                                                    }
                                                }
                                            }
                                        ]).exec((e, goals) => {
                                            if (e) {
                                                reject({ statusCode: 500 });
                                            }
                                            else {
                                                resolve(goals);
                                            }
                                        });
                                    }
                                    else {
                                        reject({ statusCode: 404 });
                                    }
                                })
                                .catch(() => reject({ statusCode: 500 }));
                        }
                        else {
                            reject({ statusCode: 404 });
                        }
                    })
                    .catch(() => reject({ statusCode: 500 }));
            });

            result
                .then(data => res.json(success({ requestId: req.id, data })))
                .catch(({ statusCode }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500 })));

        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
        }
    });


app.post('/goals/categories/:goalId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        try {
            const { goalId } = req.params;
            const { facilityId } = req.body;
            const userId = req.user_id;

            if (!validator.isMongoId(goalId) || !validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {

                const goalExists = Goal.findById(goalId);

                goalExists
                    .then(goal => {
                        if (goal) {
                            const userFacilityExists = UserFacility.find({ userId, facilityId });
                            userFacilityExists
                                .then(userFacility => {
                                    if (userFacility.length > 0) {
                                        const userFacilityId = userFacility.pop();

                                        const userGoalExists = UserGoal.find({ goalId: goal, userFacilityId });
                                        userGoalExists
                                            .then(userGoal => {
                                                if (userGoal.length === 0) {
                                                    const userGoal = new UserGoal({ goalId: goal, userFacilityId });
                                                    resolve(userGoal.save());
                                                } else {
                                                    reject({ statusCode: 409 });
                                                }
                                            })
                                            .catch(() => reject({ statusCode: 500 }));
                                    } else {
                                        reject({ statusCode: 404 });
                                    }
                                })
                                .catch(() => reject({ statusCode: 500 }));

                        } else {
                            reject({ statusCode: 404 });
                        }
                    })
                    .catch(() => reject({ statusCode: 500 }));
            });

            result
                .then(data => res.json(success({ requestId: req.id, data })))
                .catch(({ statusCode }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500 })));

        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
        }
    });


app.get('/users/:pathUserId/goals',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    async (req, res) => {
        try {
            const { facilityId } = req.query;
            const { pathUserId } = req.params;
            const myUserId = req.user_id;
            let isEqualUserId = false;
            let areFriends = false;

            if (pathUserId === myUserId)
                isEqualUserId = true;

            if (!isEqualUserId) {
                if (!validator.isMongoId(pathUserId)) {
                    return res.status(400).json(error({ requestId: req.id, code: 400 }));
                }
                else {
                    const userExists = await User.findById(pathUserId);
                    if (userExists) {
                        const friendshipExists = UserFriend.areFriends(myUserId, pathUserId);
                        friendshipExists
                            .then(data => areFriends = data)
                            .catch(e => res.status(500).json(error({ requestId: req.id, code: 500, message: e.message })));
                    }
                    else {
                        return res.status(404).json(error({ requestId: req.id, code: 404 }));
                    }
                }
            }

            if (!facilityId && !validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }
            else{
                const facilityExists = await Facility.findById(facilityId);
                if(!facilityExists){
                    return res.status(404).json(error({ requestId: req.id, code: 404 }));
                }
            }

            const result = new Promise((resolve, reject) => {
                if (areFriends || isEqualUserId) {
                    const userFacilityExist = UserFacility.getUserFacility(isEqualUserId? myUserId : pathUserId, facilityId);
                    userFacilityExist
                        .then(async(userFacility) => {
                            if (userFacility) {
                                await UserGoal.findAllUserGoals(userFacility)
                                    .then(goals => resolve(goals))
                                    .catch(e => reject({ statusCode: e.statusCode, message: e.message }));
                            } 
                            else {
                                reject({ statusCode: 404 });
                            }
                        })
                        .catch(e => reject({ statusCode: 500, message: e.message }));
                }
                else {
                    resolve([]);
                }
            });

            result
                .then(data => res.json(success({ requestId: req.id, data })))
                .catch(({ statusCode, message }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500, message })));

        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message }));
        }
    });

module.exports = app;