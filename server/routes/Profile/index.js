const express = require('express');
const {isMongoId} = require('validator');
const{ObjectId} = require('mongoose').Types;
// const {validateExistenceAccessHeader,validateSession,validateTokenAlive,upload} = require('../../middlewares');
const {error,success} = require('../../utils/helpers/response');
const app = express();
const {LIMIT_PAGE_DEFAULT} = require('../../utils/helpers/consts');
const User = require('../../db/models/User');
const SettingsRouter = require('./Settings');
const FacilityUserRouter = require('./Facility');
const {INACTIVE} = require('../../db/models/schemas/configs');

app.use('/settings',SettingsRouter);
app.use('/:userId/facilities',FacilityUserRouter);

/* Get's my user general stats.
 Missing more data: (Metrics,Medals,League);
 LIMIT/SORT is key here for fastest query.
*/
app.get('/:userId',async(req,res)=>{
    try{
        const {limit=LIMIT_PAGE_DEFAULT} = req.query;
        const {userId}= req.params;
        if(!isMongoId(userId)) throw({statusCode: 400});
        
        const profile = await User.aggregate([
            {
                "$match": {"_id": ObjectId(userId)}
            },
            {
                "$project":{
                    "userName": 1,
                    "email":1,
                    // More fields to define from user missing here such as (firstname,lastname etc).
                },
                
            },
            {
                "$lookup":{
                    "from":"wallets",
                    "let":{"userId":"$_id"},
                    "pipeline":[
                        {"$match":{
                           "$expr":{
                               "$eq":['$userId',"$$userId"]
                           }
                        }},
                    ],
                    as:'wallet'
                }
            },
            {
                "$unwind":{
                    "path": "$wallet",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$project":{
                        "userName":1,
                        "email":1,
                        "wallet":1
                }
            },
            {
                "$lookup":{
                    "from": 'user_facilities',
                    "let":{"userId":"$_id"},
                    "pipeline":[
                        {
                            "$match":{
                                "$expr":{
                                    "$eq":["$userId","$$userId"]
                                },
                            }
                        },
                        {
                            "$sort":{
                                "updatedAt":-1
                            }
                        },
                        {
                            "$limit": limit
                        },
                        {
                            "$lookup":{
                                "from":'facilities',
                                "let":{"facilityId":"$facilityId"},
                                "pipeline":[
                                    {
                                        "$match": {
                                            "$expr":{
                                                "$eq":["$_id","$$facilityId"]
                                            }
                                        }
                                    }
                                ],
                                as: 'facility'
                            },
                        },
                        {
                            "$project":{
                                "facility":1
                            }
                        },
                        {
                            "$limit":limit
                        },
                        {
                            "$unwind":{
                                "path": "$facility"
                            }
                        },
                    ],
                    "as": "user_facilities",
                }
            },
            {
                "$addFields":{
                    "facilities":{
                            "$map":{
                                "input":"$user_facilities",
                                "as": "userFacility",
                                "in": "$$userFacility.facility"
                            }
                    },
                    "userFacilities":{
                        "$map":{
                            "input": "$user_facilities",
                            "as":"userFacility",
                            "in":"$$userFacility._id"
                        }
                    }
                }
            },
            {
                "$project":{
                    'user_facilities': 0
                }
            },
            {
               "$lookup":{
                   "from": "user_achievements",
                    "let": {"user_facilities": "$userFacilities"},
                    "pipeline":[
                            {
                                "$match":{
                                    "$expr":{
                                        "$and":[
                                            {"$in":["$userFacilityId","$$user_facilities"]},
                                            {"$eq": ["$status",INACTIVE]} 
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
                                        },
                                    ],
                                    "as": "achievement"

                                }
                            },
                            {
                                "$project":{
                                    "achievementId":0
                                }
                            },
                            {
                                "$unwind":{
                                    "path": "$achievement"
                                }
                            }
                            
                    ],
                    "as":"achievements"

               },
                
            },
            {
                "$lookup":{
                    "from":"matches",
                    "let":{"userId":"$_id"},
                    "pipeline":[
                        {
                            "$match":{
                                "$expr":{
                                    "$and":[
                                        {"$in":["$$userId","$players"]},
                                        {
                                            "$ne":[null,"$endDate"]
                                        }
                                    ]
                                }
                            }
                        },
                        {
                            "$sort":{
                                "endDate": -1
                            }
                        },
                        {
                            "$limit":limit
                        },
                        {
                            "$unwind": {
                                "path": '$matches',
                                "preserveNullAndEmptyArrays": true
                                
                            }
                        },
                        {
                            "$group":{
                                "_id":"$_id",
                                "zone":{"$first": "$zoneId"},
                                "game": {"$first": "$gameId"},
                                "matches":{"$push":"$matches"}
                            }
                        },
                        {
                            "$lookup":{
                                "from":"user_matches",
                                "let":{"matches":"$matches"},
                                "pipeline":[
                                    {
                                        "$match":{
                                                "$expr":{
                                                    "$and":[
                                                            {"$eq":["$userId",ObjectId(userId)]},
                                                            {"$in":["$_id","$$matches"]}
                                                    ]
                                                    
                                                }
                                        }
                                    }
                                ],
                                "as": 'matches'
                            }
                        },
                        {
                            "$unwind":{
                                "path":"$matches"
                            }
                        },
                        {
                            "$group":{
                                "_id":"$_id",
                                "zone":{"$first":"$zone"},
                                "game":{"$first":"$game"},
                                // Here you can get power/distance/direction and any other fields you want (Score is only a sum, missing proccess)
                                // IS Score needed?(Mean we can get the score from other meta data (direction,power,distance... etc));
                                // By now we based the score on field score.
                                "score":{"$sum":"$matches.score"}
                            }
                        },
                        {
                                "$lookup":{
                                    "from": "zones",
                                    "let":{"zoneId": "$zone"},
                                    "pipeline":[
                                            {
                                                "$match":{
                                                    "$expr":{
                                                        "$eq":["$_id","$$zoneId"]
                                                    }
                                                }
                                            },

                                        {
                                            "$project":{
                                                "facilityId":1,
                                                "zoneName":1,
                                                "description":1,
                                                "status":1
                                            }
                                        }
                                            
                                    ],
                                    "as": "zone"
                                }
                        },
                        {
                            "$unwind":{
                                "path":"$zone"
                            },
                        },
                        {
                            "$lookup":{
                                "from":"games",
                                "let":{"gameId":"$game"},
                                "pipeline":[
                                    {
                                        "$match":{
                                            "$expr":{
                                                "$eq":["$_id","$$gameId"]
                                            }
                                        }
                                    },
                                    {
                                        "$project":{
                                            "name":1,
                                            "active":1,
                                            "leagueId":1
                                        }
                                    }
                                ],
                                "as":"game"
                            }
                        },
                        {
                            "$unwind":{
                                "path":"$game"
                            }
                        }
                    ],
                    "as": 'games'
                }
            }    
        ]);
        if(profile.length === 0) throw({statusCode:404});
        const globalRank =await User.getGlobalRank(userId);
        console.log("GobalRank", globalRank)
        res.json(success({requestId:req.id,data:{profile:{...profile.pop(),...globalRank}}}));
        
    }catch({statusCode,message}){
        res.status(statusCode || 500).json(error({requestId: req.id, code: statusCode || 500, message}));
    }
});


module.exports = app;