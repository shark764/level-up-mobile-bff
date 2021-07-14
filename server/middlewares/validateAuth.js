const jwt = require('jsonwebtoken');
const { error } = require('../utils/helpers/response');
const {removeKey} = require('../utils/redis');

const validateAccess = (req, res, next) => {
  const { authToken } = req;

  jwt.verify(authToken, process.env.JWT_AUTHORIZATION_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        removeKey(key, (err) => {
          if (err) {
            return res
              .status(500)
              .json(
                error({ requestId: req.id, code: 500, message: err.message })
              );
          }
          else{
            return res
            .status(406)
            .json(
              error({ requestId: req.id, code: 406 })
            );
          }
        }
        );
      
      }
      return res
        .status(500)
        .json(error({ requestId: req.id, code: 500, message: err.message }));
    }
    req.user = user;
    next();
  });
};

module.exports = validateAccess;
