const express = require('express');
const app = express();
const Facility = require('../../db/models/Facility');
const User = require('../../db/models/User');
const CheckIn = require('../../db/models/CheckIn');
const SafetyVideo = require('../../db/models/Safety_Video');
const UserFacility = require('../../db/models/User_Facility');
const validator = require('validator');
const { success, error } = require('../../utils/helpers/response');
const redisCheckIn = require('../../utils/redis/facility');
const {ObjectId} = require('mongoose').Types;
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');


//Get all facilities
app.get('/facilities',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        try {
            const userId = req.user_id;
            if (!validator.isMongoId(userId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {

                const facilities = Facility.find({}, { "name": 1 });
                facilities
                    .then(data => {
                        if (userId) {
                            //userId is sent to fetch 
                            const { lat, long } = req.query;

                            //Validations made in order to obtain lat/long required;
                            if (lat && long) {
                                const userExists = User.findById(userId);
                                userExists
                                    .then(async (user) => {
                                        if (user) {
                                            user.location.coordinates = [lat, long];
                                            try {
                                                await user.save();
                                                await Facility.collection.createIndex({ location: '2dsphere' });

                                                // QUERY get's closest facilities to the lat/long received.
                                                Facility.aggregate([
                                                    {
                                                        "$geoNear": {
                                                            "near": {
                                                                "type": "Point",
                                                                "coordinates": [Number(lat), Number(long)]
                                                            },
                                                            "distanceMultiplier": 0.000621371,
                                                            "distanceField": "distance",
                                                            "spherical": true,
                                                        }
                                                    },
                                                    { "$limit": 2 },
                                                    {
                                                        "$project": {
                                                            "name": 1,
                                                            "description": 1,
                                                            "pictures": 1,
                                                            // "distance": {
                                                            //     "$round": ["$distance", 3]
                                                            // }
                                                            "distance": 1
                                                        }
                                                    },
                                                ]).exec((e, nearFacilities) => {
                                                    if (e) {
                                                        reject({ statusCode: 500 });
                                                    }
                                                    else {
                                                        resolve(nearFacilities);
                                                    }
                                                });
                                            } catch {
                                                reject({ statusCode: 500 });
                                            }
                                        } else {
                                            reject({ statusCode: 404 });
                                        }
                                    })
                                    .catch(() => reject({ statusCode: 500 }));
                            } else {
                                reject({ statusCode: 400 });
                            }
                        } else {
                            resolve(data);
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


//Get facility by id
app.get('/facilities/:facilityId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        try {
            const { facilityId }  = req.params;
            Facility.aggregate([
                {
                    "$match": { "_id": ObjectId(facilityId) }
                },
                {
                    "$lookup": {
                        "from": "memberships",
                        "pipeline": [
                            {
                                "$match": {
                                    "facilityId": ObjectId(facilityId)
                                }
                            },
                            {
                                "$project": {
                                    "facilityId": 0,
                                    "__v": 0
                                }
                            }
                        ],
                        "as": "memberships",
                    },
                },
            ]).exec((e, facility) => {
                if (e) {
                    res.status(500).json(error({ requestId: req.id, code: 500 }));
                } else {
                    res.json(success({ requestId: req.id, data: facility }));
                }
            });
        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
        }
    });


//Checkin by user in a specific facility
app.put('/facilities/:facilityId/checkin',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        try {
            const userId = req.user_id;
            const { facilityId } = req.params;

            if (!validator.isMongoId(userId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {

                const facilityExist = Facility.findById(facilityId); //facility exist

                facilityExist
                    .then(data => {
                        if (data) {
                            const userExist = User.findById(userId);

                            userExist
                                .then(data => {
                                    if (data) {    //User exist
                                        const infoCheckIn = {
                                            facilityId,
                                            dateTime: Date.now()
                                        };

                                        redisCheckIn().setCheckIn(userId, JSON.stringify(infoCheckIn), () => {
                                            CheckIn.setCheckInUser(facilityId, userId)
                                                .then(result => resolve(result))
                                                .catch(() => reject({ statusCode: 500 }));
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


//Checkin history
app.get('/facilities/:facilityId/checkin',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    async (req, res) => {
        try {

            let showCurrent = false;
            let showAll = false;

            const { q } = req.query;
            const { inDate } = req.body;
            const { facilityId } = req.params;

            if (q) {
                if (q === 'true') {
                    showAll = true;
                }
                else if (q === 'false') {
                    if (inDate && !Number(inDate)) {
                        return res.status(400).json(error({ requestId: req.id, code: 400 }));
                    }
                }
                else {
                    return res.status(400).json(error({ requestId: req.id, code: 400 }));
                }
            }
            else {
                showCurrent = true;
            }

            let currentFacility;
            if (showCurrent) {
                currentFacility = await CheckIn.findOne({ facilityId, dateCheckIn: { $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) } });
            }
            else if (showAll) {
                currentFacility = await CheckIn.find({ facilityId });
            }
            else {
                currentFacility = await CheckIn.find({ facilityId, dateCheckIn: { $gte: new Date(new Date(inDate)), $lte: new Date(new Date(inDate).setUTCHours(23, 59, 59, 59)) } });
            }

            res.json(success({ requestId: req.id, data: currentFacility }));

        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
        }
    });


//Get the safety video information
app.get('/facilities/:facilityId/media/safety-video',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        try {

            const { facilityId } = req.params;
            const userId = req.user_id;

            if (!validator.isMongoId(facilityId) || !validator.isMongoId(userId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {

                const userFacility = UserFacility.find({ facilityId, userId });

                userFacility
                    .then(userFacility => {
                        if (userFacility && userFacility.length > 0) {
                            const oneUserFacility = userFacility.pop();
                            const safetyVideoInfo = SafetyVideo.find({ $or: [{ facilityId: null }, { $and: [{ facilityId: ObjectId(facilityId) }, { active: true }] }] });
                            safetyVideoInfo
                                .then(data => {
                                    if (data && data.length > 0) {
                                        resolve({ "videoURL": (data.length === 2 ? data[1].videoURL : data[0].videoURL), "safetyVideo": oneUserFacility.safetyVideo });
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


//Update safety video watched
app.put('/facilities/:facilityId/media/safety-video',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        try {

            const { facilityId } = req.params;
            const userId = req.user_id;

            if (!validator.isMongoId(facilityId) || !validator.isMongoId(userId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {
                const userFacility = UserFacility.find({ facilityId, userId });
                userFacility
                    .then(async (userFacility) => {
                        if (userFacility && userFacility.length > 0) {

                            const setSafetyVideo = userFacility.pop();
                            setSafetyVideo.safetyVideo = true;

                            try {
                                resolve(await setSafetyVideo.save());
                            } catch {
                                reject({ statusCode: 500 });
                            }
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


module.exports = app;