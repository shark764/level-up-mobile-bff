const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Achievement = require('./Achievement')
const UserFacility = require('./User_Facility')

const userAchievementsSchema = new mongoose.Schema({
    achievementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'achievements',
    },

    userFacilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_facilities',
    },

    achivedDate: {
        type: Date,
        required: true
    },

    claimed: {
        type: Boolean,
        required: true,
        default: false
    },

    claimDate: {
        type: Date
    }
})

userAchievementsSchema.statics.newUserAchievement = async function (data, userId) {        
    return new Promise(async (resolve, reject) => {
        const achievementId = data.achievementId
        try {
            const userFacility = await UserFacility.getUserFacility(userId, data.facilityId)
            if (!userFacility) {
                return reject('User not in facility')
            }
            const achievement = await Achievement.findOne({
                _id: achievementId
            })
            
            if (!achievement) {
                return reject('Not a valid achievement')
            }

            const userAchievement = await UserAchievement.findOne({
                achievementId: achievementId,
                userFacilityId: userFacility._id 
            })

            if (userAchievement) {
                return reject('User already has that achievement')
            }
            const userAchievementToCreate = new UserAchievement ({
                achievementId: data.achievementId,
                userFacilityId: userFacility._id,
                achivedDate: Date.now()
            })
    
            return resolve(
                await userAchievementToCreate.save(userAchievementToCreate)
            )
        } catch (err) {
            return reject(err.message)
        }
    })
}

userAchievementsSchema.statics.claim = async function (achievementId, userId, facilityId) {        
    return new Promise(async (resolve, reject) => {
        try {
            const userFacility = await UserFacility.getUserFacility(userId, facilityId)
            if (!userFacility) {
                return reject('User not in facility')
            }
            const userAchievement = await UserAchievement.findOne({
                achievementId: ObjectId(achievementId),
                userFacilityId: userFacility._id
            })

            if (!userAchievement) {
                return reject('User does not have that achievement')
            }

            if (userAchievement.claimed === true) {
                return reject('Achievement already claimed by user')
            }

            userAchievement.claimed = true;
            userAchievement.claimDate = Date.now()
        
            return resolve(
                await userAchievement.save()
            )
        } catch (err) {
            return reject(err.message)
        }
    })
}

userAchievementsSchema.statics.getAllUserAchievements = async function (userId, facilityId) {   
    return new Promise(async (resolve, reject) => {
        const userFacility = await UserFacility.getUserFacility(userId, facilityId)
        if (!userFacility) {
            return reject('User not in facility')
        }
        UserAchievement.aggregate([
            { $match : { 'userFacilityId' : userFacility._id} },
            { $lookup: {
                from: 'achievements', // collection name in db
                localField: 'achievementId',
                foreignField: '_id',
                as: 'achievement'
            }},
            { $match : { 'achievement.status' : "active" } },
            { $unwind: '$achievement'},
            { $project: {
                '_id': 1,
                'achievement.name': 1,
                'achievement.description': 1,
                'achievement.imageUrl': 1,
                'achivedDate': 1,
                'claimed': 1,
                'claimDate': 1
            }},
            { $sort : { 'achivedDate' : 1 } }
        ]).exec(function(err, userAchievements) {
            if (err) {
                reject(err)
            }
            return resolve(
                userAchievements
            )
        });
    })
}

const UserAchievement = mongoose.model('user_achievements', userAchievementsSchema)

module.exports = UserAchievement