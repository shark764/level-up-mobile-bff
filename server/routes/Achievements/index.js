const express = require('express');
const router = express.Router();
const { success } = require('../../utils/helpers/response');
const { error } = require('../../utils/helpers/response');
const Achievement = require('../../db/models/Achievement');
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');

router.post(
    '/achievement',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    (req, res) => {
        Achievement.newAchievement(req.body)
            .then(data => res.json(success({ requestId: req.id, data })))
            .catch(({ statusCode }) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500 })));
    });

module.exports = router;