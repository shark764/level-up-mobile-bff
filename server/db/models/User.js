const mongoose = require('mongoose')
const UserFacility = require('./User_Facility')
const Facility = require('../models/Facility')
const UserMatch = require('./User_Match')
const ObjectId = mongoose.Types.ObjectId

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
       
    },

    location:{
        type: {type: String, default: "Point"},
        coordinates: [{type: Number}]
    },
    password: {
        type: String,        
        required: false,
        minlength: 5
    },
    businessName: {
        type: String,
        //required: false,
        trim: true
    },
    firstName: {
        type: String,
        required: false,
        trim: true
    },
    lastName: {
        type: String,
        required: false,
        trim: true
    },
    displayName: {
        type: String,
        required: false,
        trim: true
    }, 
    providerId: {
        type: String,
        trim: true
    },
    provider: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    active: {
        type: Boolean,
        required: true
    }
})


// Get a rank/score of a specific user/facility.
userSchema.statics.getRankByFacility= async(userId, facilityId)=>{
    try{
        let userFacilities = await UserFacility.find({facilityId}).distinct('_id');
        let userFacility = await UserFacility.findOne({facilityId,userId})
        return new Promise((resolve,reject)=>{
            userFacility? 
            UserMatch.aggregate([
                {
                "$match":{
                    "userFacilityId":{
                        "$in": userFacilities
                    }
                }
                },
                {
                    "$group":{
                        "_id": "$userFacilityId",
                        "score": {
                            "$sum" : "$score"
                        },
                       
                    }
                },
                {
                    "$sort":{
                        "score": -1
                    }
                },
             
                {
                    "$group":{
                        "_id": null,
                        "docs": {"$push": "$$ROOT"}
                    }
                },
                { 
                    "$project": { 
                        "_id": 0,
                       "R": { 
                           "$map": {
                               "input": { "$range": [ 0, { "$size": "$docs" } ] },
                                "in": {
                                   "$mergeObjects": [ 
                                       { "rank": { "$add": [ "$$this", 1 ] } },
                                       { "$arrayElemAt": [ "$docs", "$$this" ] }
                                   ]
                               }
                           }
                       }
                    }
                },
                { 
                    "$unwind": "$R" 
                },
                { 
                    "$replaceRoot": { "newRoot": "$R" } 
                },
                {
                    "$match":{"_id": userFacility._id}
                }
            
            
            
            ]).exec((err,results)=>{
                // console.log("Resultsss",results);
                if(err) reject(err);
                if(results.length === 0) reject("Check query based error");
                resolve( results.pop());
            }) : reject("No userFacilityFound please check params.")
    })
}catch(e){
    throw new Error(e)
}
 
}

// Get the global rank with score of user.
userSchema.statics.getGlobalRank = async(userId)=>{
    try{
        return new Promise((resolve,reject)=>{
            UserMatch.aggregate([
                {
                    "$group":{
                        "_id": "$userFacilityId",
                        "score":{
                            "$sum": "$score"
                        },
                    }
                },
                {
                    "$lookup":{
                        "from": "user_facilities",
                        "let":{"id": '$_id'},
                        "pipeline":[
                            {
                               "$match":{
                                   "$expr":{
                                       "$eq":["$_id","$$id"]
                                   }
                               } 
                            },
                            {
                                "$project":{
                                    "userId": 1,
                                    "facilityId": 1,
                                }
                            }
                        ],
                        "as": "userFacility"
                    }
                },
                {
                    "$unwind":{
                        "path": "$userFacility"
                    }
                },
                {
                    "$group":{
                        "_id": "$userFacility.userId",
                        "score":{
                            "$sum": "$score",
                        },
                    }
                },
                {
                    "$sort":{
                        "score": -1
                    }
                },
                {
                    "$group":{
                        "_id": null,
                        "docs": {"$push": "$$ROOT"}
                    }
                },
                { 
                    "$project": { 
                        "_id": 0,
                       "R": { 
                           "$map": {
                               "input": { "$range": [ 0, { "$size": "$docs" } ] },
                                "in": {
                                   "$mergeObjects": [ 
                                       { "rank": { "$add": [ "$$this", 1 ] } },
                                       { "$arrayElemAt": [ "$docs", "$$this" ] }
                                   ]
                               }
                           }
                       }
                    }
                },
                { 
                    "$unwind": "$R" 
                },
                { 
                    "$replaceRoot": { "newRoot": "$R" } 
                },
                {
                       "$match":{
                           "_id": ObjectId(userId)
                       } 
                }
                
            ]).exec((err,results)=>{
                if(err) reject(err)
                resolve(results.pop());
            })
        })
        
    }catch(e){
        throw new Error(e)   
    }
}

// Get ranking with score in facilities of user.
userSchema.statics.getRankingInFacilities = async(userId)=>{
    try{
        // Get facilities in which user is member.
        let facilities = await UserFacility.find({userId}).distinct("facilityId");
        
        return new Promise((resolve,reject)=>{
            UserFacility.aggregate([
           
                {
                    "$match":{
                        "facilityId":{
                            "$in": facilities
                        }
                    }
                },
                {
                    "$lookup":{
                        "from": "user_matches",
                        "let":{"facid": "$_id"},
                        "pipeline":[
                           {
                            "$match":{
                               "$expr":{
                                   "$eq":["$userFacilityId","$$facid"]
                               }
                            }
                           },
                          
                        ],
                        "as": "matches"
                    }
                },
                {
                    "$unwind": {
                        "path": "$matches"
                    }   
                },
                {
                    "$group":{
                        "_id": "$_id",
                        "score":{
                            "$sum": "$matches.score"
                        },
                        "facilityId":{
                            "$first": "$facilityId"
                        },
    
                        "userId":{
                            "$first": "$userId"
                        }
                     
                    }
                },
                {
                    "$sort":{
                        "score": -1
                    }
                },
                {
                    "$group":{
                        "_id": null,
                        "docs": {"$push": "$$ROOT"}
                    }
                },
                { 
                    "$project": { 
                        "_id": 0,
                       "R": { 
                           "$map": {
                               "input": { "$range": [ 0, { "$size": "$docs" } ] },
                                "in": {
                                   "$mergeObjects": [ 
                                       { "rank": { "$add": [ "$$this", 1 ] } },
                                       { "$arrayElemAt": [ "$docs", "$$this" ] }
                                   ]
                               }
                           }
                       }
                    }
                },
                { 
                    "$unwind": "$R" 
                },
                { 
                    "$replaceRoot": { "newRoot": "$R" } 
                },
                {
                    "$match":{
                        "userId": ObjectId(userId),
                    }
                },
                {
                    "$lookup":{
                        "from": "facilities",
                        "let": {"fac": "$facilityId"},
                        "pipeline":[
                            {
                                "$match":{
                                    "$expr":{
                                        "$eq":["$_id","$$fac"]
                                    }
                                }
                            }
                        ],
                        "as": "facility"
                    }
                },
    
                {
                    "$unwind":{
                        "path": "$facility"
                    }
                },
                {
                    "$project":{
                        "facility.__v": 0,
                        "facilityId":0
                    }
                }
                
                
             
            ]).exec((err,results)=>{
                console.log("results",results);
                if(err) reject(err);
                resolve(results);
            })
            
        })
    }catch(e){
        throw new Error(e)
    }
}

// find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// find user by id
userSchema.statics.getUserById = async (id) => {
    //const userId = mongoose.Types.ObjectId(id)
    const user =  User.findById(id, (err, user)=> {
        
    })
    return user;
    

}




const User = mongoose.model('users', userSchema)

module.exports = User
