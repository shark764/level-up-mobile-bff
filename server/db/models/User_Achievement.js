const mongoose = require('mongoose');
const {ObjectId} = mongoose.Types;
const Achievement = require('./Achievement');
const UserFacility = require('./User_Facility');
const {
    ACHIEVEMENT_NOT_FOUND,
    ALREADY_ACHIEVED,
    ALREADY_CLAIMED,
    USER_NOT_IN_FACILITY
} = require('../../utils/helpers/consts');


const userAchievementsSchema = new mongoose.Schema({
    achievementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'achievements'
    },

    userFacilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_facilities'
    },

    dateOfAchivied: {
        type: Date,
        required: true,
        default: new Date()
    },

    status: {
        type: String,
        required: true,
        default: 'not_claimed'
    },

    dateOfClaim: {
        type: Date
    }
});

userAchievementsSchema.statics.newUserAchievement = async function (data, userId, achievementId) {
    return new Promise(async (resolve, reject) => {
        try {
            const userFacility = await UserFacility.getUserFacility(userId, data.facilityId);
            if (!userFacility) {
                return reject('User not in facility');
            }
            const achievement = await Achievement.findOne({
                _id: achievementId
            });
            
            if (!achievement) {
                return reject('Not a valid achievement');
            }

            const userAchievement = await UserAchievement.findOne({
                achievementId,
                userFacilityId: userFacility._id 
            });

            if (userAchievement) {
                return reject({
                    code: 409,
                    message: ALREADY_ACHIEVED
                });
            }
            const userAchievementToCreate = new UserAchievement ({
                achievementId: achievementId,
                userFacilityId: userFacility._id,
            });
    
            return resolve(
                await userAchievementToCreate.save(userAchievementToCreate)
            );
        } catch (err) {
            return reject(err.message);
        }
    });
};

userAchievementsSchema.statics.claim = async function (achievementId, userId, facilityId) {
    return new Promise(async (resolve, reject) => {
        try {
            const userFacility = await UserFacility.getUserFacility(userId, facilityId);
            if (!userFacility) {
                return reject({
                    code: 404,
                    message: USER_NOT_IN_FACILITY
                });
            }
            const userAchievement = await UserAchievement.findOne({
                achievementId: ObjectId(achievementId),
                userFacilityId: userFacility._id
            });

            if (!userAchievement) {
                return reject({
                    code: 404,
                    message: ACHIEVEMENT_NOT_FOUND
                });
            }

            if (userAchievement.status === 'claimed') {
                return reject({
                    code: 409,
                    message: ALREADY_CLAIMED
                });
            }

            userAchievement.status = 'claimed';
            userAchievement.dateOfClaim = Date.now();
        
            return resolve(
                await userAchievement.save()
            );

        } catch (err) {
            return reject({
                code: 400
            });
        }
    });
};


userAchievementsSchema.statics.getAllUserAchievements = async function (userId, facilityId) {   
    return new Promise(async (resolve, reject) => {

        let userFacilitiesIds = [];
        if (!facilityId) {
            const allUserFacility = await UserFacility.getAllUserFacility(userId);
            if (!allUserFacility) {
                return reject({
                    code: 404,
                    message: USER_NOT_IN_FACILITY
                });
            }
            allUserFacility.forEach((userFacility) => {
                userFacilitiesIds.push(userFacility._id);
            });
        } else {
            const userFacility = await UserFacility.getUserFacility(userId, facilityId);
            if (!userFacility) {
                return reject({
                    code: 404,
                    message: USER_NOT_IN_FACILITY
                });
            }
            userFacilitiesIds.push(userFacility._id);
        }

        UserAchievement.aggregate([
            { $match : {
                'userFacilityId' : {
                    $in: userFacilitiesIds
                }
            }},
            { $lookup: {
                from: 'achievements', // collection name in db
                localField: 'achievementId',
                foreignField: '_id',
                as: 'achievement'
            }},
            { $match : { 'achievement.status' : "active" } },
            { $unwind: '$achievement'},

            { $lookup: {
                from: 'user_facilities',
                localField: 'userFacilityId',
                foreignField: '_id',
                as: 'user_facility'
            }},
            { $unwind: '$user_facility'},

            { $lookup: {
                from: 'facilities',
                localField: 'user_facility.facilityId',
                foreignField: '_id',
                as: 'facility'
            }},
            { $unwind: '$facility'},

            { $project: {
                '_id': 1,
                'achievement.name': 1,
                'achievement.description': 1,
                'achievement.imageUrl': 1,
                'facility._id': 1,
                'facility.name': 1,
                'dateOfAchivied': 1,
                'status': 1,
                'dateOfClaim': 1
            }},
            { $sort : { 'dateOfAchivied' : 1 } }
        ]).exec((err, userAchievements) => {
            if (err) {
                return reject({
                    code: 400
                });
            }
            return resolve(
                userAchievements
            );
        });
    });
};


const UserAchievement = mongoose.model('user_achievements', userAchievementsSchema);
module.exports = UserAchievement;