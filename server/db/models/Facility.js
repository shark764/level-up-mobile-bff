const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;
import { isMongoId } from 'validator';

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


facilitySchema.statics.validateFacility = async(FacilityId)=> {
    try {
        const result = {
            code: 200,
        };

        if (!isMongoId(FacilityId)) {
            result.code = 400;
            return result
        }

        const facility = await Facility.findById(FacilityId);

        if (!facility || facility.deletedAt) {
            result.code = 404;
        }


        return result;
    } catch (err) {
        throw err;
    }
}


const Facility = mongoose.model('facilities',facilitySchema);
module.exports = Facility;