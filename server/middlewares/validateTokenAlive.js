const {getKey} = require('../utils/redis');
const {error} = require('../utils/helpers/response');
const validateAccessToken = (req, res, next) => {  
    
    const {accessToken, user_id} = req;
    const key = `{${user_id}}{SESSION}{${accessToken}}`;
    getKey(key, (err, value) => {
        if(err) {
            return res.status(500).json(error({requestId: req.id, code: 500, message: err.message }));
        }
        if (!value) {
            return res
            .status(403)
            .json(error({requestId: req.id, code: 403}));
        }
        req.authToken = value;
        req.key = key;
        next();           
    });
};

module.exports =  validateAccessToken;