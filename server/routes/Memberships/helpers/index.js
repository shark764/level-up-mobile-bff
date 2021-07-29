const UserFacility = require('../../../db/models/User_Facility');
const UserMembership = require('../../../db/models/User_Membership');
const Facility = require('../../../db/models/Facility');
const PaymentMethod = require('../../../db/models/Payment_Method');
const setExpirationDate = require("../../../utils/helpers/setExpirationDate");

const createMembership = async(userId,membership)=>{

    const userFacility = new UserFacility({ userId, facilityId: membership.facilityId});
    const userMembership = new UserMembership({
        userFacilityId: userFacility,
        membershipId: membership,
        price:membership.price ,
       expirationDate:membership.validPeriod + Date.now()
    });
    
    const savedUserMembership = await Promise.all([userFacility.save(),userMembership.save()]);
    return savedUserMembership;
};


module.exports = {
    createMembership,
};
