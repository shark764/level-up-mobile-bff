
const UserFacility = require('../../../db/models/User_Facility');
const UserMembership = require('../../../db/models/User_Membership');
const Facility = require('../../../db/models/Facility');
const PaymentMethod = require('../../../db/models/Payment_Method')
const setExpirationDate = require("../../../utils/helpers/setExpirationDate");

const createMembership = async({user,membership,payload})=>{

    const facility = await Facility.findById(membership.facilityId);
    const userFacility = new UserFacility({userId: user, facilityId: facility});
    let paymentMethod = await PaymentMethod.getIdByName(payload.Type);
    console.log("PaymentMethodId",paymentMethod);
    const userMembership = new UserMembership({
        userFacilityId: userFacility,
        membershipId: membership,
        paymentMethodId: paymentMethod,
        price: membership.price,
        expirationDate: setExpirationDate(membership.validPeriod)

    })
    await userFacility.save();
    await userMembership.save();
    return userMembership;
}


module.exports = {
    createMembership,
}