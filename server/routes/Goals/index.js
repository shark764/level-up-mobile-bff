const express = require('express');
const app = express();
const GoalCategory = require('../../db/models/Goal_Category')
const UserFacility = require('../../db/models/User_Facility')
const UserGoal = require('../../db/models/User_Goal')
const Goal = require('../../db/models/Goal')
const validateAccess = require('../../middlewares/validateAccess');
const verifyToken = require('../../middlewares/verifyToken');
const ObjectId = require('mongoose').Types.ObjectId;
const {error,success} = require('../../utils/helpers/response')
const validator = require('validator');

app.get('/goalscategories',validateAccess,async(req,res)=>{
    try{
       const goalCategories = await GoalCategory.find({}); 
       res.json(success({requestId: req.id, data:{categories: goalCategories}}));
    }catch(err){
        res.status(500).json(error({requestId: req.id,code: 500, message: err}))
    }
})

app.get('/goals/:id',async(req,res)=>{
    try{
        const id = req.params.id;
        const {userId,facilityId} = req.body;
        const userFacility = await UserFacility.find({userId,facilityId})
        if(userFacility.length === 0) throw new Error("No User/Facility Found, check body payload"); 
        const userGoals = await UserGoal.find({userFacilityId: userFacility});
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
            if(err) res.status(500).json(error({requestId: req.id, code: 500, message: err}))
            res.json(success({requestId: req.id, data:{goals}}))
        })
        
    }catch(e){
        res.status(500).json(error({reqId:req.id, code:500, message: e.message}))
    }
   
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
                        res.json(success({requestId: req.id,data:{ message: "Goal added successfully.", userGoal}}))
                       }else{
                           res.status(409).json(error({requestId: req.id,code:409 ,message: "Goal is already added to this specific user."}))
                       }
                        
                        
                    }else{
                        res.status(404).json(error({requestId: req.id,code: 404 ,message: "No relation found user/facility please check payload."}))
                    }
                }else{
                    res.status(400).json(error({requestId: req.id,code:400 ,message: 'Missing params in payload.'}))
                }
            }else{
                res.status(404).json(error({requestId: req.id, code:404 ,message: "No Goal found with that ID."}))
            }
            

    }catch(err){
        res.status(500).json(error({requestId: req.id, code:500, message: err}))
    }
})

app.get('/mygoals/:userId',[validateAccess,verifyToken],async(req,res)=>{
    try{
        const {userId}= req.params;
        const {facilityId} = req.body;
        const userFacility = await UserFacility.getUserFacility(userId,facilityId);
       
        if(userFacility){
               UserGoal.findAllUserGoals(userFacility).then((goals=>{
                   res.json(success({requestId: req.id, data: {goals}}))
               })).catch(error=>{
                   res.status(500).json({requestId:req.id, code:500, message: error})
               })
        }else{
            res.status(400).json(error({requestId: req.id, code:400, message: "Wrong params sent please check if valid." }))
        }
        
    }catch(e){
        res.status(500).json({requestId: req.id, code: 500, message: err})
    }
})

module.exports = app;