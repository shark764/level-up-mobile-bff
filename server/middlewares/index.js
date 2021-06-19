const upload = require('./upload');
const validateAccess = require('./validateAccess');
const validateExistenceAccessHeader = require('./validateExistenceAccessHeader');
const validateSession = require('./validateSession');
const validateTokenAlive = require('./validateTokenAlive');
const verifyToken = require('./verifyToken');

module.exports ={
    upload,
    validateAccess,
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive,
    verifyToken
};