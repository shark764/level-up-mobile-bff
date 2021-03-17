const express = require('express');
const app = express();
const GoalCategory = require('../../db/models/Goal_Category')
const UserFacility = require('../../db/models/User_Facility')
const UserGoal = require('../../db/models/User_Goal')
const Goal = require('../../db/models/Goal')
const validateAccess = require('../../middlewares/validateAccess');
const verifyToken = require('../../middlewares/verifyToken');
const ObjectId = require('mongoose').Types.ObjectId;


app.get('/goalscategories',validateAccess,async(req,res)=>{
    try{
       const goalCategories = await GoalCategory.find({}); 
       res.json({success: true, categories: goalCategories});
    }catch(error){
        res.json({success: true, error})
    }
})

app.get('/goals/:id',[validateAccess,verifyToken],async(req,res)=>{
    
        const id = req.params.id;
        const {userId,facilityId} = req.body;
        const userFacility = await UserFacility.find({userId,facilityId})
        console.log("UserFacility",userFacility)
        const userGoals = await UserGoal.find({userFacilityId: userFacility});
        console.log("userGoals",userGoals);
        Goal.aggregate([
            {
                "$match":{"goalCategoryId": ObjectId(id)}
            },
           {
               "$redact":{
                   "$cond":{
                        "if": {"$in":["$_id", userGoals.map(({goalId})=>ObjectId(goalId))]},
                        "then": "$$PRUNE",
                        "else": "$$DESCEND"
                   }
               }
           }
        ]).exec((err,goals)=>{
            console.log("Goals",goals);
            if(err) res.json({success: true, error: err})
            res.json({success: true, goals})
        })
           
   
})

app.post('/goalscategories/:id',[validateAccess,verifyToken],async(req,res)=>{
    try{    
            const {userId,facilityId} = req.body;
            const goal = await Goal.findById(req.params.id);
            if(goal){
                if(userId && facilityId){
                    let userFacility = await UserFacility.find({userId,facilityId});
                    if(userFacility.length !== 0 ){
                       userFacilityId = userFacility.pop();
                       let userGoal = await UserGoal.find({goalId: goal, userFacilityId});
                       if(userGoal.length === 0){
                        let userGoal = new UserGoal({goalId: goal, userFacilityId});
                        await userGoal.save();
                        res.json({success: true, msg: "Goal added successfully.", userGoal})
                       }else{
                           res.json({success: false, error: "Goal is already added to this specific user."})
                       }
                        
                        
                    }else{
                        res.status(404).json({success: false, error: "No relation found user/facility please check payload."})
                    }
                }else{
                    res.status(400).json({success: false, error: 'Missing params in payload.'})
                }
            }else{
                res.status(404).json({success: false, error: "No Goal found with that ID."})
            }
            

    }catch(error){
        res.json({success: false, error})
    }
})

module.exports = app;