import { isMongoId } from 'validator';
const mongoose = require('mongoose');
const membershipSchema = require('./schemas/Membership');

membershipSchema.statics.validateMembership = async(MembershipId)=>   {

        const result = {
            membership : Membership.object,
            code: 200,
        };

        if (!isMongoId(MembershipId)) {
            result.code = 400;
            return result;
        }


         result.membership = await Membership.findById(MembershipId);


        if (!result.membership || result.membership.deletedAt) {
            result.code = 404;
        }
        return result;
};


const Membership = mongoose.model('memberships',membershipSchema); 
module.exports = Membership;
