const express = require('express');
const{ObjectId} = require('mongoose').Types;
const {isMongoId} = require('validator');
const Facility = require('../../../db/models/Facility');
const User = require('../../../db/models/User');
const { error, success } = require('../../../utils/helpers/response');
const {LIMIT_PAGE_DEFAULT} = require('../../../utils/helpers/consts');
const {INACTIVE} = require('../../../db/models/schemas/configs');
const app = express.Router({mergeParams:true});

app.get('/:facilityId',async(req,res)=>{
    try{
        const {userId,facilityId} = req.params;
        const {limit = LIMIT_PAGE_DEFAULT} = req.query;
        if(!isMongoId(userId) || !isMongoId(facilityId)) throw({statusCode: 400});
        const [parsedUserId,parsedFacilityId] = [ObjectId(userId),ObjectId(facilityId)];
        const profile = await Facility.aggregate([
                {
                    "$match":{
                        "_id": parsedFacilityId
                    }
                },
                {
                    "$project":{
                        "name":1
                    }
                },
                {
                    "$lookup":{
                        "from":"user_facilities",
                        "let":{facilityId: parsedFacilityId},
                        "pipeline":[
                            {
                                "$match":{
                                    "$expr":{
                                        "$and":[
                                            {"$eq": ["$facilityId","$$facilityId"] },
                                            {"$eq":["$userId",parsedUserId]}
                                        ]
                                    }
                                }
                                    
                            }
                        ],
                        "as":"userFacility"
                    }
                },
                {
                    "$unwind":{
                        "path":"$userFacility"
                    }
                },
                {
                    "$lookup":{
                        "from":"wallets",
                        "pipeline":[
                            {
                                "$match":{
                                    "$expr":{
                                            "$eq":["$userId",parsedUserId]
                                        }
                                }
                            }
                        ],
                        "as":'wallet'
                    }
                },
                {
                    "$unwind":{
                        "path":"$wallet",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    "$lookup":{
                        "from":"user_achievements",
                        "let":{"userFacilityId":"$userFacility._id"},
                        "pipeline":[
                            {
                                "$match":{
                                    "$expr":{
                                        "$and":[
                                            {"$eq":["$userFacilityId","$$userFacilityId"]},
                                            {"$eq":["$status",INACTIVE]},
                                        ]
                                        
                                    }
                                }
                            },
                            {
                                "$sort":{
                                    "updatedAt": -1
                                }
                            },
                            {
                                "$limit":limit
                            },
                            {
                                "$lookup":{
                                    "from":"achievements",
                                    "let":{"achievement":"$achievementId"},
                                    "pipeline":[
                                        {
                                            "$match":{
                                                "$expr":{
                                                    "$eq":["$_id","$$achievement"]
                                                }
                                            }
                                        } 
                                    ],
                                    "as":"achievement"
                                }
                            },
                            {
                                "$unwind":{
                                    "path":"$achievement"
                                }
                            }
                        ],
                        "as":"achievements"
                    }
                },
                {
                    "$lookup":{
                        "from":"user_goals",
                        "let":{"userFacility":"$userFacility._id"},
                        "pipeline":[
                            {
                                "$match":{
                                    "$expr":{
                                        "$and":[
                                            {"$eq":["$status",false]},
                                            {"$eq":["$userFacilityId","$$userFacility"]}
                                        ]
                                    }
                                }
                            },
                            {
                                "$sort":{
                                    "updatedAt":-1,
                                }
                            },
                            {
                                "$limit": limit
                            },
                            {
                                "$lookup":{
                                    "from":"goals",
                                    "let":{"goalId":"$goalId"},
                                    "pipeline":[
                                        {
                                            "$match":{
                                                "$expr":{
                                                    "$eq":["$_id","$$goalId"],
                                                }
                                            }
                                        }
                                    ],
                                    "as":'goal',
                                }
                            },
                            {
                                "$unwind":{
                                    "path":"$goal"
                                }
                            }
                        ],
                        "as": "goals"
                    }
                }
        ]);
        const facilityRank = await User.getRankingInFacilities(userId,facilityId);
        console.log("FacilityRank",facilityRank);
        res.json(success({requestId: req.id, data:{profile: profile.pop()}}));
    }catch(e){
        res.status(e.statusCode || 500).json(error({requestId:req.id,code:e.statusCode || 500, message: e.message}));
    }
    
});

module.exports = app;