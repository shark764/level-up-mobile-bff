const mongoose = require('mongoose');
const Goal = require('./Goal')
const userGoalSchema = new mongoose.Schema({
    userFacilityId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_facilities',
        required: true,
    },

    goalId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'goals',
        required: true,
    },

    status:{
        type: Number,
        default: 0
    }


})

userGoalSchema.statics.findAllUserGoals = async (userFacilityId)=>{
    return new Promise((resolve,reject)=>{
        UserGoals.aggregate([
            {
                "$match": {"userFacilityId": userFacilityId._id}
            },
            {
                "$lookup":{
                    "from": "goals",
                    "localField":"goalId",
                    "foreignField": "_id",
                    "as": "goal",
                }
               
            },
            {
                "$unwind": "$goal"
                       
            },
            {
                "$project":{
                    "__v": 0,
                    "userFacilityId": 0
                }
            }
         ]).exec((err,results)=>{
                if(err) reject(err)
                resolve(results);
         })
     
    })
       
}

const UserGoals = mongoose.model('user_goal',userGoalSchema)
module.exports = UserGoals