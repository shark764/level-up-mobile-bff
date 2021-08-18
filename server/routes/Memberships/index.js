const express = require('express');
const app = express();
const {error,success} = require('../../utils/helpers/response');
const UserMemberships = require('./UserMemberships');
const Membership = require('../../db/models/Membership');

const {
       validateTokenAlive,
       validateExistenceAccessHeader,
       validateSession,
      } = require('../../middlewares');

// parse various different custom JSON types as JSON
// app.use(express.json());
app.use('/users/memberships',UserMemberships);

app.get('/memberships/:membershipId',
   [
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive
   ],async(req,res)=>{
    try{
        const {membership,code} = await 
        Membership.validateMembership(req.params.membershipId);

        if (code !== 200) {
          return res.status(code).json(
            error({
              requestId: req.id,
              code
            })
          );
        }

        const populatedMembership = await membership.populate('facilityId');
        
        res.json(success({requestId: req.id, data:{membership: populatedMembership}}));
        
    }catch(err){
        res.status(500).json(error({requestId:req.id,code:500 ,message:err.message}));
    }
});

module.exports = app;