const express = require('express');
const app = express();
const Facility = require('../../db/models/Facility')
const User = require('../../db/models/User')
const UserFacility = require('../../db/models/User_Facility')
const Membership = require('../../db/models/MemberShip')
const verifyPaymentPayload = require('../../utils/helpers/validatePaymentPayload')
const {createMembership} = require('./helpers')
const ObjectId = require('mongoose').Types.ObjectId;



// parse various different custom JSON types as JSON
app.use(express.json());


app.post('/membership/free/:facilityId/:userId',async(req,res)=>{
  
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
                        res.json({success: true, user_facility: userFacility});
                       }).catch(e=>{
                            res.status(e.statusCode).json({success: false, error: e.error})
                       })
                }else{
                    // Facility it's not free.
                    res.status(401).json({success: false, error: "Facility it's not free"})
                }
                
            }else{
                res.status(404).json({success: false, error: "User not found with that ID."})
            }
        }else{
            res.status(404).json({success: false, error: "Facility not found."})
        }

      }catch(error){
          res.status(500).json({success: false, error})
      }
    
})

app.post('/membership/:membershipId/:userId',async(req,res)=>{

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
                                res.json({success: true, membership: newMembership});
                            }else{ 
                                res.status(404).json({success: false, error: "There was a problem with payment, please try again."});
                            }
            
                    }).catch(e=>{
                        res.status(e.statusCode).json({success: false, error: e.error})
                    })
        
                }
            
            }else{
                res.status(404).json({success: false, error: "No membership found with that ID."})
            }
        }catch(error){
            res.json({success:false,error});
        }  
        
        
        
  
});


app.get('/membership/:id',async(req,res)=>{
    try{
        const membership = await Membership.findById(req.params.id).populate('facilityId','name');
        if(membership){
                res.json({success: true, membership});
        }else{
            res.json({success: false, error: "No membership found with that id."})
        }
    }catch(error){
        res.status(500).json({success:false, error})
    }
})

app.get('/memberships/:userId',async(req,res)=>{
  
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