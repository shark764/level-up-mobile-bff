const jwt = require('jsonwebtoken')
const error = require('../utils/helpers/response').error

const validateAccess = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
        return res
            .status(403)
            .json(error({ requestId: req.id, code: 403, message: 'Missing auth header' }))
    }
    const accessToken = authHeader.split(' ')[1]
    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, user) => {
        if (err) {
            if(err.name === 'TokenExpiredError') {
                return res
                    .status(401)
                    .json(error({ requestId: req.id, code: 401, message: 'Token expired' }))
            }
            return res
                .status(403)
                .json(error({ requestId: req.id, code: 403, message: 'Token not valid' }))
        }
        req.user = user
        next()
    })
}

module.exports = validateAccess