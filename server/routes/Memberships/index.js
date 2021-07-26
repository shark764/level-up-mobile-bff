const express = require('express');
const app = express();
const Membership = require('../../db/models/Membership');
const {error,success} = require('../../utils/helpers/response');
const userMemberships = require('./UserMemberships');

const {
       validateTokenAlive,
       validateExistenceAccessHeader,
       validateSession,
      } = require('../../middlewares');

// parse various different custom JSON types as JSON
app.use(express.json());
app.use('/users/memberships',userMemberships);

app.get('/memberships/:membershipId',
   [
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive
   ],async(req,res)=>{
    try{
        
        const validationResult = await 
userMemberships.validateMembership(req.params.membershipId);

        if (validationResult.code !== 200) {
          return res.status(validationResult.code).json(
            error({
              requestId: req.id,
              code: validationResult.code,
            })
          );
        }

        const membership = await validationResult.membership.populate('facilityId');
        
                res.json(success({requestId: req.id, data:{membership}}));
        
    }catch(err){
        res.status(500).json(error({requestId:req.id,code:500 ,message:err.message}));
    }
});

module.exports = app;