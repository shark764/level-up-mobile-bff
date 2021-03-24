const express = require('express')
const router = express.Router()
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const UserAchievement = require('../../db/models/User_Achievement')
const UserFacility = require('../../db/models/User_Facility')

const validateAccess = require('../../middlewares/validateAccess')


router.post('/user/:userId/achievements', validateAccess, async (req, res) => {
    UserAchievement.newUserAchievement(req.body, req.params.userId)
        .then (data => {
            res.status(201)
                .json(success({
                    requestId: req.id,
                    data: data
                }))
        }).catch( err => {
            res.status(400)
                .json(error({
                    requestId: req.id,
                    code: 400,
                    message: err
                }))
        })    
})

router.get('/user/:userId/achievements/', validateAccess, async (req, res) => {
    UserAchievement.getAllUserAchievements(req.params.userId, req.body.facilityId)
        .then (data => {
            res.status(200)
                .json(success({
                    requestId: req.id,
                    data: data
                }))
        }).catch( err => {
            res.status(400)
                .json(error({
                    requestId: req.id,
                    code: 400,
                    message: err
                }))
        })    
})

router.put('/user/:userId/achievements/claim', validateAccess, async (req, res) => {

    UserAchievement.claim(req.body.achievementId, req.params.userId, req.body.facilityId)
        .then (data => {
            res.status(200)
                .json(success({
                    requestId: req.id,
                    data: data
                }))
        }).catch( err => {
            res.status(400)
                .json(error({
                    requestId: req.id,
                    code: 400,
                    message: err
                }))
        })
})

module.exports = router
