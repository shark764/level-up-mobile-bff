const jwt = require('jsonwebtoken');
const {error} = require('../utils/helpers/response');

const validateSession = (req, res, next) => {
    const  {accessToken} = req;
    
    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, id) => {
        if (err) {
            if(err.name === 'TokenExpiredError') {
                return res
                    .status(401)
                    .json(error({ requestId: req.id, code: 401}));
            }
            return res
            .status(500)
            .json(error({ requestId: req.id, code: 500, message: err.message }));
        }
        req.user_id = id.data;
        next();
    });
};

module.exports =  validateSession;