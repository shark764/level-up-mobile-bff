const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const UserFacilitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users' 
    },

    facilityId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'facilities',
    },

    status:{
        type: Boolean,
        default: true
    },

    dateCreated:{
        type: Date,
        default: Date.now()

    },

    dateUpdated:{
        type: Date,
        default: Date.now()
    }
    // MISSING!!!
    // Missing ROLES, userCreated, userUpdated. ADMIN...

})


UserFacilitySchema.statics.isAlreadyMember = async(userId, facilityId) => {
    return new Promise((resolve, reject) => {
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
                reject({ statusCode: 500, error:err });
            } else if (relation.length !== 0) {
                reject({ statusCode: 409, error: 'User is already a member' });
            } else {
                resolve(true);
            }
        })
    })
}

UserFacilitySchema.statics.getUserFacility = async(userId, facilityId) => {
        try {
            return UserFacility.findOne({
                'facilityId': ObjectId(facilityId),
                'userId': ObjectId(userId)
            })
        } catch (err) {
            return null;
        }
    }

const UserFacility = mongoose.model('user_facilities', UserFacilitySchema)
module.exports = UserFacility