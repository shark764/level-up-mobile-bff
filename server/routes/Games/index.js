const express = require('express');
const router = express.Router();
const Game = require('../../db/models/Game');
const { success, error } = require('../../utils/helpers/response');
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');


router.post('/game',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ], (req, res) => {
        
        Game.newGame(req.body, req.user_id)
            .then(data => res.json(success({requestId: req.id, data })))
            .catch(({ statusCode, message }) => { res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500, message }));});
    });

module.exports = router;