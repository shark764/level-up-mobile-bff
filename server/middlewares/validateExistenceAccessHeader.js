const {error} = require('../utils/helpers/response');

const validateAccessHeader = (req, res, next)=>{

    const  accessHeader = req.headers.access;
    
    if (!accessHeader) {
        return res
            .status(403)
            .json(error({ requestId: req.id, code: 403 }));
    }
    const [,accesToken] = accessHeader.split(' ');
    req.accessToken = accesToken;

    next();
};

module.exports = validateAccessHeader;