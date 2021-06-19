const express = require('express');
const app = express();
const validateAccess = require('../../middlewares/validateAccess');
const verifyToken = require('../../middlewares/verifyToken');
const validator = require('validator');
const {success} = require('../../utils/helpers/response');
const {error} = require('../../utils/helpers/response');
const SafetyVideo = require('../../db/models/Safety_Video');
const UserFacility = require('../../db/models/User_Facility');
const {ObjectId} = require('mongoose').Types;
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');

app.get('/facilities/media/safety-video/:facilityId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    async (req, res) => {
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
                                .catch(e => { reject({ statusCode: 500 }); });
                        }
                        else {
                            reject({ statusCode: 404 });
                        }
                    })
                    .catch(e => { reject({ statusCode: 500 }); });
            });

            result
                .then(data => res.status(200).json(success({ requestId: req.id, data })))
                .catch(e => res.status(e.statusCode).json({ requestId: req.id, code: e.statusCode }));

        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
        }
    });


app.put('/facilities/media/safety-video/:facilityId', [validateAccess, verifyToken], async (req, res) => {
    try {

        const { facilityId } = req.params;
        const { userId } = req.body;

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
                        } catch (e) {
                            reject({ statusCode: 500 });
                        }
                    }
                    else {
                        reject({ statusCode: 404 });
                    }
                })
                .catch(e => { reject({ statusCode: 500 }); });
        });

        result
            .then(data => res.status(200).json(success({ requestId: req.id, data })))
            .catch(e => res.status(e.statusCode).json({ requestId: req.id, code: e.statusCode }));

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
    }
});

module.exports = app;