const express = require('express');
const app = express ();
const Facility = require('../../db/models/Facility')
const User = require('../../db/models/User');
const CheckIn = require('../../db/models/CheckIn');
const validator = require('validator');
const validateAccess = require('../../middlewares/validateAccess')
const verifyRequest = require('../../middlewares/verifyToken')
const { success, error } = require('../../utils/helpers/response')
const redisCheckIn = require('../../utils/redis/facility')
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
                            

                        ]).exec((err,nearFacilities)=>{
                            err ? res.status(400).json(error({requestId: req.id, code:400 , message: err })) : res.json(success({requestId: req.id,data:{facilities,nearFacilities}}));
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
        
    }catch(err){
        res.status(500).json(error({requestId: req.id,code: 500 ,message: err}))
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

            
        ]).exec((err,facility)=>{
           if(err){
                res.status(500).json(error({requestId: req.id,code:500,message:err}))
           }else if(facility.length === 0){
                res.status(404).json(error({requestId: req.id, code: 404 ,message: "No facility found with that ID."}))
           }else{
                res.json(success({requestId: req.id,data:{facility}}))
           }

           
        })
    }catch(err){
        res.status(500).json(error({requestId: req.id, code:500 ,message: err }))
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

//1. Check in by user
app.put('/facility/checkin/:id',[validateAccess,verifyRequest],async (req, res) => {
    try {
        const { userId } = req.body;

        if (!validator.isMongoId(userId)) {
            return res.status(500)
                .json({
                    requestId: req.id,
                    code: 500,
                    message: `Invalid IDS format, please check body payload ID ${userId}`
                });
        }

        facilityExist = await Facility.findById(req.params.id); //facility exist
        if (facilityExist) {
            userExist = await User.findById(userId);
            if (userExist) {    //User exist
                let infoCheckIn = {
                    facilityId: req.params.id,
                    dateTime: Date.now()
                }

                redisCheckIn().setCheckIn(userId, JSON.stringify(infoCheckIn), (e, value) => {
                    CheckIn.setCheckInUser(req.params.id, userId)
                        .then(result => {
                            res.status(200)
                                .json(success({
                                    requestId: req.id,
                                    data: { redisMessage: e ? e : "Information was added to Redis Server successfully", mongoMessage: "Information was added to MongoDB successfully", detail: result }
                                }));
                        })
                        .catch(e => {
                            res.status(500)
                            .json(error({
                                requestId: req.id,
                                code: 500,
                                message: err
                            }));
                        });
                });
            }
            else {
                res.status(404)
                    .json({
                        requestId: req.id,
                        code: 404,
                        message: `User Id ${userId} doesn't exist`
                    });
            }
        }
        else {
            res.status(404)
                .json({
                    requestId: req.id,
                    code: 404,
                    message: `Facility Id ${req.params.id} doesn't exist`
                });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json(error({ requestId: req.id, code: 500, message: err }))
    }
})


//2. Get list of check in, current, all and specific date
app.get('/facility/checkin/:id', async (req, res) => {
    try {

        let showCurrent = false;
        let showAll = false;

        const { q } = req.query;
        const { inDate } = req.body;

        if (q) {
            if (q === 'true') {
                showAll = true;
            }
            else if (q === 'false') {
                if (inDate && Number(inDate)) {
                    return res.status(500)
                        .json(error(
                            {
                                requestId: req.id,
                                code: 500,
                                message: `Missing parameter date`
                            }));
                }
            }
            else {
                return res.status(500)
                    .json(error(
                        {
                            requestId: req.id,
                            code: 500,
                            message: `Wrong value for q parameter (use true or false instead)`
                        }));
            }
        }
        else {
            showCurrent = true;
        }

        if (showCurrent) {
            currentFacility = await CheckIn.findOne({ facilityId: req.params.id, dateCheckIn: {$gte: new Date(new Date().setUTCHours(0,0,0,0))} });
        }
        else if (showAll) {
            currentFacility = await CheckIn.find({ facilityId: req.params.id });
        }
        else {
            currentFacility = await CheckIn.find({ facilityId: req.params.id, dateCheckIn: {$gte: new Date(new Date(inDate)), $lte: new Date(new Date(inDate).setUTCHours(23,59,59,59)) } });
        }

        if (currentFacility) {
            res.status(200)
                .json(success({
                    requestId: req.id,
                    data: currentFacility
                }));
        }
        else {
            res.status(404)
                .json(error({
                    requestId: req.id,
                    code: 404,
                    message: `Facility Id ${req.params.id} doesn't exist or doesn't have any active check in`
                }));
        }
    } catch (err) {
        console.log(err);
        res.status(500).json(error({ requestId: req.id, code: 500, message: err }))
    }
})

module.exports = app