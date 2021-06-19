const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;

const facilitySchema = new mongoose.Schema({
    name:{
            type: String,
            required: true,
    },

    description:{
        type: String,
        required: true,
    },

    address:{
            type: String,
            required: true,
    },

    location:{
        type: {type: String, default: "Point"},
        coordinates: [{type: Number, required: true}]
    },

    schedule:{
            type: String,
            required: true,
    },

    phoneNumber: {
            type: String,
    },

    pictures:[
        {
            image:{
                type: String,
            },

            comment:{
                type: String,
            }
        }
    ],

    zones:[
        {
            name: {
                type: String
            },

            description:{
                type: String
            }
        }
    ],

    amenities:[
        {type: String}
    ]  
});


facilitySchema.statics.freeMembership  = async (id)=>{
    const memberships = await Facility.aggregate([
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
        {
            "$project":{
                "memberships": 1
            }
        }
    ]);
// console.log("Memberships",memberships)
const membership = memberships.pop();
// If our array is empty it means it has no memberships meaning its free
return  membership.memberships.length === 0 ?  true : false;
};


const Facility = mongoose.model('facilities',facilitySchema);
module.exports = Facility;