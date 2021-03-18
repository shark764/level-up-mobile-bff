const express = require('express');
const app = express ();
const Facility = require('../../db/models/Facility')
const User = require('../../db/models/User');
const validateAccess = require('../../middlewares/validateAccess')
const verifyRequest = require('../../middlewares/verifyToken')
const {success,error} = require('../../utils/helpers/response')
// const Membership = require('../../db/models/MemberShip')
const ObjectId = require('mongoose').Types.ObjectId;
app.get('/facilities',[validateAccess,verifyRequest],async(req,res)=>{
    try{
        const {userId} = req.query;
        let facilities = await Facility.find({},{"name":1})
        if(userId){
            // userId is sent to fetch 
            const {lat,long} = req.query
            // Validations made in order to obtain lat/long required;
            if( lat && long){
                    const user = await User.findById(userId);
                    if(user){
                        user.location.coordinates = [lat,long];
                        await user.save();
                        await Facility.collection.createIndex({location: '2dsphere'});
                        // QUERY get's closest facilities to the lat/long received.
                        Facility.aggregate([
                           
                            {
                                "$geoNear": {
                                    "near":{
                                        "type": "Point",
                                        "coordinates": [Number(lat),Number(long)]
                                    },
                                    "distanceMultiplier": 0.000621371,
                                    "distanceField": "distance",
                                    "spherical": true,
                                }
                            },
                            {"$limit": 2},
                            {"$project":{
                                "name": 1,
                                "description": 1,
                                "pictures": 1,
                                "distance": {
                                    "$round": ["$distance",3]
                                },

                            }},
                            

                        ]).exec((error,nearFacilities)=>{
                            error ? res.status(400).json(error({requestId: req.id, code:400 , message: error })) : res.json(success({requestId: req.id,data:{facilities,nearFacilities}}));
                        })

                        
                    }else{
                        res.status(404).json(error({requestId: req.id,code:404 ,message: "User not found"}))
                    }
            }else{
                res.status(400).json(error({requestId: req.id, code:400 ,message: "Need Lat and long params." }))
            }
        }else{
           
            res.json(success({requestId: req.id, data:{facilities}}));
        }
        
    }catch(error){
        res.status(500).json(error({requestId: req.id,code: 500 ,message: error}))
    }
})

app.get('/facility/:facilityId',validateAccess,async(req,res)=>{
    try{
        const id = req.params.facilityId;
        Facility.aggregate([
            {
                "$match": {"_id": ObjectId(id)}
            },
            {
                "$lookup": {
                    "from": "memberships",
                    "pipeline":[
                        {
                            "$match": {
                                "facilityId": ObjectId(id)
                            }
                        },
                        {
                            "$project":{
                                "facilityId": 0,
                                "__v": 0
                            }
                        }
                    ],
                     "as": "memberships",               
                },
                

            },

            
        ]).exec((error,facility)=>{
           if(error){
                res.status(500).json(error({requestId: req.id,code:500,message:error}))
           }else if(facility.length === 0){
                res.status(404).json(error({requestId: req.id, code: 404 ,message: "No facility found with that ID."}))
           }else{
                res.json(success({requestId: req.id,data:{facility}}))
           }

           
        })
    }catch(error){
        res.status(500).json(error({requestId: req.id, code:500 ,message: error }))
    }
})


// app.get('/membership',async(req,res)=>{
//     try{
//         const facilities = await Facility.find({}).limit(1);
//         const facility = facilities.pop();

//         const membership = new Membership({
//             name: "First membership",
//             price: 150,
//             benefits: ["Great","Notbad"],
//             validPeriod: 6,
//             facilityId: facility,
//         })
//         await membership.save();
//         res.json({success: true, membership})

//     }catch(error){
//         res.json({success:false, error})
//     }
// })

module.exports = app