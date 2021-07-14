const express = require('express');
const router = express.Router();
const League = require('../../db/models/League');
const { success, error } = require('../../utils/helpers/response');
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');


router.post('/league',
[
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive
], 
(req, res) => {

    League.newLeague(req.body, req.user_id)
    .then(data => res.json(success({requestId: req.id, data })))
    .catch(({ statusCode }) => { res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500 }));});
});


module.exports = router;