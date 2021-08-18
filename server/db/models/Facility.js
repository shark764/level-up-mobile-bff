import { isMongoId } from 'validator';
const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;
const facilitySchema = require('./schemas/Facility');
const client = require('../../utils/redis/connection');

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
const membership = memberships.pop();
// If our array is empty it means it has no memberships meaning its free
return  membership.memberships.length === 0 ?  true : false;
};


facilitySchema.statics.validateFacility = async(FacilityId)=> {
 
        const result = {
            code: 200,
        };

        if (!isMongoId(FacilityId)) {
            result.code = 400;
            return result;
        }

        const facility = await Facility.findById(FacilityId);

        if (!facility || facility.deletedAt) {
            result.code = 404;
        }

        result.facility = facility;
        return result;
};

facilitySchema.statics.setCheckin = (key,data,callback)=>{
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();
    const s = d.getSeconds();
    const secondsUntilEndOfDay = (24*60*60) - (h*60*60) - (m*60) - s;
    return client.set(key,data,'EX',secondsUntilEndOfDay,callback);
};
const Facility = mongoose.model('facilities',facilitySchema);
module.exports = Facility;