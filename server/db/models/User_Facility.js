const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;
const {USER_MEMBER} = require('../../utils/helpers/consts');
const UserFacilitySchema = require('./schemas/User_Facility');

UserFacilitySchema.statics.isAlreadyMember = (userId, facilityId) => new Promise((resolve, reject) => {
        UserFacility.aggregate([
            { "$match":
                { "$and": [
                        { "facilityId": ObjectId(facilityId) },
                        { "userId": ObjectId(userId) }
                    ]
                }
            }
        ]).exec((err, relation) => {
            if (err) {
                reject({ statusCode: 500, message:err.message });
            } else if (relation.length !== 0) {
                reject({ statusCode: 409, message: USER_MEMBER});
            } else {
                resolve(true);
            }
        });
    });



const UserFacility = mongoose.model('user_facilities', UserFacilitySchema);
module.exports = UserFacility;
