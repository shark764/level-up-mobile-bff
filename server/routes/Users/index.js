const express = require('express');
const app = express();
const { error, success } = require('../../utils/helpers/response');
const { USER_INFORMATION } = require('../../utils/helpers/consts');

const User = require('../../db/models/User');

const {
    validateTokenAlive,
    validateExistenceAccessHeader,
    validateSession,
} = require('../../middlewares');



app.get('/users/:userId', [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    async(req, res) => {
        try {
            const { user, code } = await
            User.validateUser(req.params.userId);

            if (code !== 200) {
                return res.status(code).json(
                    error({
                        requestId: req.id,
                        code
                    })
                );
            }

            res.json(success({ requestId: req.id, data: { user: user } }));

        } catch (err) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: err.message }));
        }
    });

app.put('/users/:userId', [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],
    async(req, res) => {

        try {
            const { userId } = req.params;
            const userPayload = req.body;

            const validationResult = await User.validateUser(userId);
            if (validationResult.code !== 200) {
                return res.status(validationResult.code).json(
                    error({
                        requestId: req.id,
                        code: validationResult.code,
                    })
                );
            }
            const userUpdate = await User.findByIdAndUpdate(userId, userPayload,{new: true}).select(USER_INFORMATION);
            res.json(success({ requestId: req.id, data: { user: userUpdate } }));

        } catch (err) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: err.message }));
        }
    });



module.exports = app;