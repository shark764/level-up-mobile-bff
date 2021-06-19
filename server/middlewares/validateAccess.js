const jwt = require('jsonwebtoken');
const {error} = require('../utils/helpers/response');

const validateAccess = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res
            .status(403)
            .json(error({ requestId: req.id, code: 403 }));
    }
    const [,accessToken] = authHeader.split(' ');
    jwt.verify(accessToken, process.env.JWT_AUTHORIZATION_SECRET, (err, user) => {
        if (err) {
            if(err.name === 'TokenExpiredError') {
                return res
                    .status(401)
                    .json(error({ requestId: req.id, code: 401}));
            }
            return res
                .status(500)
                .json(error({ requestId: req.id, code: 500 }));
        }
        req.user = user;
        next();
    });
};

module.exports = validateAccess;