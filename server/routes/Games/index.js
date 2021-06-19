const express = require('express');
const router = express.Router();
const { success } = require('../../utils/helpers/response');
const { error } = require('../../utils/helpers/response');
const Game = require('../../db/models/Game');
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');


router.post('/game',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ], (req, res) => {
        Game.newGame(req.body, req.user_id)
            .then(data => res.json(success({requestId: req.id, data })))
            .catch(({ statusCode }) => { res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500 }));});
    });

module.exports = router;