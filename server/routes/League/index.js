const express = require('express')
const router = express.Router()
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const League = require('../../db/models/League')

const validateAccess = require('../../middlewares/validateAccess')


router.post('/league', validateAccess, async (req, res) => {
    League.newLeague(req.body, req.user.data._id)
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