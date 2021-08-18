const express = require('express');
const app = express();
const User = require('../../db/models/User');
const { error, success } = require('../../utils/helpers/response');
const { validateSession, validateTokenAlive, validateExistenceAccessHeader } = require('../../middlewares');


app.get('/leaderboard',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    async (req, res) => {
        try {
            //userId sent on payload 
            const userId = req.user_id;

            const leaderBoard = await User.leaderBoard();
            User.getGlobalRank(userId)
                .then(globalRank => res.json(success({ reqId: req.id, data: { leaderBoard, globalRank } })))
                .catch(({statusCode}) => res.status(statusCode || 500).json(error({ requestId: req.id, code: statusCode || 500 })));

        } catch (e) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
        }
    });

module.exports = app;