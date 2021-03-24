const express = require('express');
const app = express();
const Facility = require('../../db/models/Facility')
const User = require('../../db/models/User')
const UserFacility = require('../../db/models/User_Facility')
const Membership = require('../../db/models/MemberShip')
const verifyPaymentPayload = require('../../utils/helpers/validatePaymentPayload')
const {createMembership} = require('./helpers')
const ObjectId = require('mongoose').Types.ObjectId;
const validateAccess = require('../../middlewares/validateAccess');
const verifyToken = require('../../middlewares/verifyToken');
const {error,success} = require('../../utils/helpers/response')


// parse various different custom JSON types as JSON
app.use(express.json());


app.post('/membership/free/:facilityId/:userId',[validateAccess,verifyToken],async(req,res)=>{
  
      try{

        const { facilityId,userId} = req.params;
        const facility = await Facility.findById(facilityId);
        if(facility){
            // Facility found.
            const user = await User.findById(userId);
            if(user){
                // Validations..
                // Verify if facility is free.
                const freeMemberShip = await Facility.freeMembership(facilityId);
                if(freeMemberShip){

                    UserFacility.isAlreadyMember(userId,facilityId).then(async()=>{
                        const userFacility = new UserFacility({userId, facilityId});
                        await userFacility.save();
                        res.json(success({requestId: req.id, data:{ user_facility: userFacility}}));
                       }).catch(e=>{
                            res.status(e.statusCode).json(error({requestId: req.id,code: e.statusCode ,message: e.error}))
                       })
                }else{
                    // Facility it's not free.
                    res.status(401).json(error({requestId: req.id, code: 401 ,message: "Facility it's not free"}))
                }
                
            }else{
                res.status(404).json(error({requestId: req.id,code: 404 ,message: "User not found with that ID."}))
            }
        }else{
            res.status(404).json(error({requestId: req.id,code:404 ,message: "Facility not found."}))
        }

      }catch(err){
          res.status(500).json(error({requestId: req.id, code:500 , message: err}))
      }
    
})

app.post('/membership/:membershipId/:userId',[validateAccess,verifyToken],async(req,res)=>{

        try{
            const {membershipId,userId} = req.params;
            // Payment payload;
            const payload = req.body
            const membership = await Membership.findById(membershipId);
            if(membership){
                let user = await User.findById(userId);
                if(user){

                    UserFacility.isAlreadyMember(userId,membership.facilityId).then(async()=>{
                        
                            let validPayload = await verifyPaymentPayload(payload,membership.price)
                            if(validPayload){
                                let newMembership = await createMembership({user,membership,payload});
                                res.json(success({requestId: req.id, data:{membership: newMembership}}));
                            }else{ 
                                res.status(404).json(error({requestId: req.id,code:404 ,message: "There was a problem with payment, please try again."}));
                            }
            
                    }).catch(e=>{
                        res.status(e.statusCode).json(error({requestId: req.id,code: e.statusCode ,message: e.error}))
                    })
        
                }
            
            }else{
                res.status(404).json(error({requestId: req.id,code: 404 ,message: "No membership found with that ID."}))
            }
        }catch(err){
            res.status(500).json(error({requestId:req.id,code:500,message:err}));
        }  
        
        
        
  
});


app.get('/membership/:membershipId',validateAccess,async(req,res)=>{
    try{
        const membership = await Membership.findById(req.params.membershipId).populate('facilityId','name');
        if(membership){
                res.json(success({requestId: req.id, data:{membership}}));
        }else{
            res.status(404).json(error({requestId: req.id,code:404,message: "No membership found with that id."}))
        }
    }catch(error){
        res.status(500).json(error({requestId:req.id,code:500 ,message:error}))
    }
})

// Missing parsing responses in this Endpoint...
app.get('/memberships/:userId',[validateAccess,verifyToken],async(req,res)=>{
  
        const id = req.params.userId;
        UserFacility.aggregate([
            {
                "$match":{"userId": ObjectId(id)}
            },
            {
                "$project":{
                    "_id": 0,
                    "facilityId":1,
                }
            },

        ]).exec(async(err,memberships)=>{
            // console.log("This are memberships",memberships)
            if(err){
                throw new Error(err);
            }else if(memberships.length === 0){
                // No memberships is not an error.
                res.json({success: true, memberships})
            }else{
                let parsedMemberships = memberships.map(item=>item.facilityId);
                let facilities = await Facility.find({_id:{"$in": parsedMemberships}},'name pictures');
                res.json({success: true, memberships: facilities});
            }
        })
   
})


module.exports = app