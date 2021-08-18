const UserFacility = require('../../../db/models/User_Facility');
const UserMembership = require('../../../db/models/User_Membership');


const createMembership = async(userId,membership)=>{

    const userFacility = new UserFacility({ userId, facilityId: membership.facilityId,createdBy: userId});
    const userMembership = new UserMembership({
        userFacilityId: userFacility,
        membershipId: membership,
        price:membership.price ,
        expirationDate:membership.validPeriod + Date.now(),
        // for now total its going to be the same as price to keep it simple, but later on other disscounts should be applied in here.
        total: membership.price,
    });
    
    const savedUserMembership = await Promise.all([userFacility.save(),userMembership.save()]);
    return savedUserMembership;
};


module.exports = {
    createMembership,
};
