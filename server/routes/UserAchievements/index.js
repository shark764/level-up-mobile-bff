const express = require('express');
const router = express.Router({ mergeParams: true });
const {success} = require('../../utils/helpers/response');
const {error} = require('../../utils/helpers/response');
const UserAchievement = require('../../db/models/User_Achievement');


const {
    validateTokenAlive,
    validateExistenceAccessHeader,
    validateSession,
    validateAuth
} = require('../../middlewares');

router.post('/:id',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive,
        validateAuth,
    ],
    async (req, res)  =>  {
    await UserAchievement.newUserAchievement(req.body, req.params.userId, req.params.id)
        .then (data => {
            res.status(201)
                .json(success({
                    requestId: req.id,
                    data
                }));
        }).catch( err => {
            res.status(err.code || 400)
                .json(error({
                    requestId: req.id,
                    code: err.code || 400,
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
        validateAuth,
    ],
    async (req, res) => {
        await UserAchievement.getAllUserAchievements(req.params.userId, req.query.facility)
            .then (data => {
                res.status(200)
                    .json(success({
                        requestId: req.id,
                        data
                    }));
            }).catch( err => {
                res.status(err.code || 400)
                    .json(error({
                        requestId: req.id,
                        code: err.code || 400,
                        message: err.message
                    }));
            });
});

router.put(
    '/:id',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive,
        validateAuth,
    ],
    async (req, res) => {
        await UserAchievement.claim(req.params.id, req.params.userId, req.body.facilityId)
            .then (data => {
                res.status(200)
                    .json(success({
                        requestId: req.id,
                        data
                    }));
            }).catch( err => {
                res.status(err.code || 400)
                    .json(error({
                        requestId: req.id,
                        code: err.code || 400,
                        message: err.message
                    }));
            });
});

module.exports = router;
