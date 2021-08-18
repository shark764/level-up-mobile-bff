const express = require('express');
const router = express.Router({ mergeParams: true });
const {success,error} = require('../../../utils/helpers/response');
const UserAchievement = require('../../../db/models/User_Achievement');


const {
    validateTokenAlive,
    validateExistenceAccessHeader,
    validateSession,
} = require('../../../middlewares');

router.post('/:achievementId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive,
    ],
     (req, res)  =>  {
    const {userId, achievementId} = req.params;
    const {facilityId} = req.body;
     UserAchievement.newUserAchievement(facilityId, userId,achievementId)
        .then (data => {
            res.status(200)
                .json(success({
                    requestId: req.id,
                    data
                }));
        }).catch( err => {
            res.status(err.statusCode || 500)
                .json(error({
                    requestId: req.id,
                    code: err.statusCode || 500,
                    message: err.message
                }));
        });
});

router.get(
    '/',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive,
    ],
     (req, res) => {
         const {userId} = req.params;
         const {facility} = req.query;
         UserAchievement.getAllUserAchievements(userId, facility)
            .then (data => {
                res.status(200)
                    .json(success({
                        requestId: req.id,
                        data
                    }));
            }).catch( err => {
                res.status(err.statusCode || 500)
                    .json(error({
                        requestId: req.id,
                        code: err.statusCode || 500,
                        message: err.message
                    }));
            });
});

router.put(
    '/:achievementId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive,
    ],
     (req, res) => {
         const {userId, achievementId} = req.params;
         const {facilityId} = req.body;
         UserAchievement.claim(achievementId, userId, facilityId)
            .then (data => {
                res.status(200)
                    .json(success({
                        requestId: req.id,
                        data
                    }));
            }).catch( err => {
                res.status(err.statusCode || 500)
                    .json(error({
                        requestId: req.id,
                        code: err.statusCode || 500,
                        message: err.message
                    }));
            });
});


module.exports = router;