const express = require('express')
const router = express.Router()
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const Achievement = require('../../db/models/Achievement')


router.post('/achievement', async (req, res) => {
    Achievement.newAchievement(req.body)
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



module.exports = router