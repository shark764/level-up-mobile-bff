const express = require('express');
const app = express();
const Facility = require('../../db/models/Facility');
const User = require('../../db/models/User');
const CheckIn = require('../../db/models/CheckIn');
const SafetyVideo = require('../../db/models/Safety_Video');
const UserFacility = require('../../db/models/User_Facility');
const {ObjectId} = require('mongoose').Types;
const { success, error } = require('../../utils/helpers/response');
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');
const validator = require('validator');
const { USER_NOT_IN_FACILITY, LIMIT_PAGE_DEFAULT } = require('../../utils/helpers/consts');


//Get all facilities
app.get('',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
            const userId = req.user_id;
            const result = new Promise((resolve, reject) => {
                const facilities = Facility.find({}, { "name": 1,"pictures": 1 });
                facilities
                    .then(data => {
                            const { lat, long,limit} = req.query;
                            if (Number(lat) && Number(long)) {
                                const userExists = User.findById(userId);
                                userExists
                                    .then(async (user) => {
                                            user.location.coordinates = [lat, long];
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
                                                    { "$limit": Number(limit) || LIMIT_PAGE_DEFAULT },
                                                    {
                                                        "$project": {
                                                            "name": 1,
                                                            "description": 1,
                                                            "pictures": 1,

                                                            // READ !!!! THIS IS NOT A BUG EVENTUALLY THIS WILL GET TO LIFE!
                                                            "distance": 1
                                                            //  "distance": {
                                                            //      "$round": ["$distance", 3]
                                                            //  }
                                                        }
                                                    },
                                                ]).exec((e, nearFacilities) => e? reject(e) : resolve(nearFacilities));
                                    }).catch(e=> reject(e));
                            } else {
                                resolve(data);
                            }
                       
                    });
            });

            result
                .then(data => res.json(success({ requestId: req.id, data })))
                .catch(({ statusCode, message }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500, message })));
    });


//Get facility by id
app.get('/:facilityId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ], 
    (req, res) => {   
            const { facilityId }  = req.params;
            if (!validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }
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
                        res.status(500).json(error({ requestId: req.id, code: 500, message: e.message }));
                    }else if(facility.length  === 0){
                        res.status(404).json(error({requestId: req.id, code:404}));
                    } 
                    else {
                        res.json(success({ requestId: req.id, data: facility }));
                    }
                });
            });
        


//Checkin by user in a specific facility
app.put('/:facilityId/checkin',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
            const userId = req.user_id;
            const { facilityId } = req.params;

            if (!validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {

                const facilityExist = Facility.findById(facilityId);
                facilityExist
                    .then(facility => {
                        if (facility){
            
                            const infoCheckIn = {
                                facilityId,
                                dateTime: Date.now()
                            };

                            Facility.setCheckin(userId, JSON.stringify(infoCheckIn), async(err) => {
                                    if(err) reject(err);
                                    const checkin = await  CheckIn.findOneAndUpdate(
                                        { facilityId, dateCheckIn: { $gt: new Date(new Date().setHours(0, 0, 0, 0)) }},
                                        {$setOnInsert:{dateCheckIn: Date.now()},$push:{users:{_id: ObjectId(userId)}}},
                                        {new: true, upsert:true}
                                    );

                                    resolve(checkin);        
                    });

                    }else{
                            reject({ statusCode: 404 });
                        }
                    }).catch(e=> reject(e));
            });

            result
                .then(data => res.json(success({ requestId: req.id, data })))
                .catch(({ statusCode, message }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500, message })));
    });


//Checkin history N/A
app.get('/:facilityId/checkin',
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

            if (!validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }
                        
            const facilityExist = await Facility.findById(facilityId);
            if(facilityExist){
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
            }
            else{
                res.status(404).json(error({ requestId: req.id, code: 404 }));
            }

        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message }));
        }
    });


//Get the safety video information
app.get('/:facilityId/media/safety-video',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
    
            const { facilityId } = req.params;
            const userId = req.user_id;
            if (!validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve, reject) => {

                const userFacility = UserFacility.findOne({ facilityId, userId });

                userFacility
                    .then(userFacility => {
                        if (userFacility) {
                            const safetyVideoInfo = SafetyVideo.find({ $or: [{ facilityId: null }, { $and: [{ facilityId: ObjectId(facilityId) }, { active: true }] }] });
                            safetyVideoInfo
                                .then(data => {
                                    if (data.length > 0) {
                                        resolve({ "videoURL": (data.length === 2 ? data[1].videoURL : data[0].videoURL), "safetyVideo": userFacility.safetyVideo });
                                    }
                                    else {
                                        reject({ statusCode: 404 });
                                    }
                                }).catch(e=> reject(e));
                        }
                        else {
                            reject({ statusCode: 404, message: USER_NOT_IN_FACILITY });
                        }
                    }).catch(e=> reject(e));
            });

            result
                .then(data => res.json(success({ requestId: req.id, data })))
                .catch(({ statusCode, message }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500, message })));
    });


//Update safety video watched
app.put('/:facilityId/media/safety-video',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {

            const { facilityId } = req.params;
            const userId = req.user_id;

            if (!validator.isMongoId(facilityId)) {
                return res.status(400).json(error({ requestId: req.id, code: 400 }));
            }

            const result = new Promise((resolve,reject)=>{
                UserFacility.findOneAndUpdate({facilityId,userId},
                    {safetyVideo: true},{new: true},(err,doc)=>{
                        if(err) reject(err);
                        if(!doc) reject({statusCode: 404});
                        resolve(doc);
                    });
            });
            result
                .then(data => res.json(success({ requestId: req.id, data })))
                .catch(({ statusCode, message }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500, message })));
    });


module.exports = app;