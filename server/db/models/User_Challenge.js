const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;
const UserFacility = require('./User_Facility');

const userChallengeSchema = new mongoose.Schema({

    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'challenges',
        required: true,
    },

    matchId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'matches',
        required: false,
    },

    challengeFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_facilities',
    },

    challengeTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_facilities',
    },

    statusUpdateDate: {
        type: Date,
        required: false,
    },

    status: {
        type: String,
        required: true,
        default: 'pending'
    },

});


userChallengeSchema.statics.updateStatus = async function (userChallengeId, userId, data) {        
    return new Promise(async (resolve, reject) => {
        try {
            const userFacility = await UserFacility.getUserFacility(userId, data.facilityId);
            if (!userFacility) {
                return reject('User not in facility');
            }
            const userChallenge = await UserChallenge.findOne({
                _id: ObjectId(userChallengeId),
                challengeTo: userFacility._id
            });

            if (!userChallenge) {
                return reject('Invalid Challenge');
            }

            if (userChallenge.status === data.status) {
                return reject('Challenge already has that status');
            }

            userChallenge.status = data.status;
            userChallenge.statusUpdateDate = Date.now();
        
            return resolve(
                await userChallenge.save()
            );
        } catch (err) {
            return reject(err.message);
        }
    });
};

userChallengeSchema.statics.getReceivedChallenges = async function (userId, data) {        
    return new Promise(async (resolve, reject) => {
        try {
            const userFacility = await UserFacility.getUserFacility(userId, data.facilityId);
            if (!userFacility) {
                return reject('User not in facility');
            }
            UserChallenge.aggregate([
                { $match : { 'challengeTo' : userFacility._id} },

                { $lookup: {
                    from: 'challenges',
                    localField: 'challengeId',
                    foreignField: '_id',
                    as: 'challenge'
                }},
                { $unwind: '$challenge'},

                { $lookup: {
                    from: 'user_facilities',
                    localField: 'challengeFrom',
                    foreignField: '_id',
                    as: 'user_facility'
                }},
                { $unwind: '$user_facility'},

                { $lookup: {
                    from: 'users',
                    localField: 'user_facility.userId',
                    foreignField: '_id',
                    as: 'user'
                }},
                { $unwind: '$user'},
                
                { $project: {
                    '_id': 1,
                    'challenge.name': 1,
                    'challenge.requiredScore': 1,
                    'challenge.timeFrame': 1,
                    'status': 1,
                    'userFrom.firstName': 'user.firstName',
                    'userFrom.lastName': 'user.lastName'                  
                }}

            ]).exec((err, userChallenges) => {
                if (err) {
                    reject(err);
                }
                return resolve(
                    userChallenges
                );
            });


        } catch (err) {
            return reject(err.message);
        }
    });
};
const UserChallenge = mongoose.model('user_challenges', userChallengeSchema);

module.exports = UserChallenge;