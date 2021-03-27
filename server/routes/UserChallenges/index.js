
const express = require('express')
const router = express.Router()
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const sendChallengesFromMatch = require('../../db/transactions/sendChallengesFromMatch').sendChallengesFromMatch
const UserChallenge = require('../../db/models/User_Challenge')
const validateAccess = require('../../middlewares/validateAccess')

router.post('/userchallenge', validateAccess, async (req, res) => {
    await sendChallengesFromMatch(req.body)
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
        }) ;
})


router.put('/user/:userId/challenge/:id', validateAccess, async (req, res) => {
    await UserChallenge.updateStatus(req.params.id, req.params.userId, req.body)
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
        }) ;
})

router.get('/user/:userId/challenge', validateAccess, async (req, res) => {
    await UserChallenge.getReceivedChallenges(req.params.userId, req.body)
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
        }) ;
})



module.exports = router
