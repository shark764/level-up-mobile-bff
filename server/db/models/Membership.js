const mongoose = require('mongoose');
import { isMongoId } from 'validator';

const membershipSchema = new mongoose.Schema({
    price:{
        type: Number,
        required: true,
    },

    name:{
        type: String,
        required: true
    },

    benefits:[
        {type: String,required: true}
    ],

    validPeriod: {
        type: Number,
        required: true
    },

    facilityId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'facilities'
    }
});

membershipSchema.statics.validateMembership = async(MembershipId)=>   {
    try {
        const result = {
            membership : Membership.object,
            code: 200,
        };

        if (!isMongoId(MembershipId)) {
            result.code = 400;
            return result
        }


         result.membership = await Membership.findById(MembershipId);


        if (!result.membership || result.membership.deletedAt) {
            result.code = 404;
        }


        return result;
    } catch (err) {
        throw err;
    }
}


const Membership = mongoose.model('memberships',membershipSchema); 
module.exports = Membership;
