import { isMongoId } from 'validator';
const mongoose = require('mongoose');
const Achievement = require('./Achievement');
const UserFacility = require('./User_Facility');
const {
    ACHIEVEMENT_NOT_FOUND,
    USER_NOT_IN_FACILITY,
    ALREADY_CLAIMED
} = require('../../utils/helpers/consts');
const {
    INACTIVE
} = require('./schemas/configs');

const userAchievementsSchema = require('./schemas/User_Achievement');

userAchievementsSchema.statics.newUserAchievement = async (facilityId, userId, achievementId) => {
    if (!isMongoId(userId) || !isMongoId(achievementId) || !isMongoId(facilityId)) throw ({ statusCode: 400 });
    const userFacilityId = await UserFacility.findOne({ userId, facilityId });
    if (!userFacilityId) throw ({ statusCode: 404, message: USER_NOT_IN_FACILITY });
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) throw ({ statusCode: 404, message: ACHIEVEMENT_NOT_FOUND });
    const userAchievement = await UserAchievement.findOne({ achievementId, userFacilityId });
    if (userAchievement) throw ({ statusCode: 409 });
    const newUserAchievement = await UserAchievement.create({ userFacilityId, achievementId });
    return newUserAchievement;
};

userAchievementsSchema.statics.claim = async(achievementId, userId, facilityId)=>{
            if(!isMongoId(achievementId) || !isMongoId(userId) || !isMongoId(facilityId)) throw({statusCode: 400});
            const userFacilityId = await UserFacility.findOne({userId,facilityId},'_id');
            if(!userFacilityId) throw({statusCode: 404,message: USER_NOT_IN_FACILITY});
            const userAchievement = await UserAchievement.findOne({userFacilityId,achievementId});
            if(!userAchievement) throw({statusCode:404, message: ACHIEVEMENT_NOT_FOUND});
            if(userAchievement.status === INACTIVE) throw({statusCode: 409, message: ALREADY_CLAIMED});
            userAchievement.status = INACTIVE;
            userAchievement.dateOfAchieved = Date.now();
            const savedUserAchievement = await userAchievement.save();
            return savedUserAchievement;
};


userAchievementsSchema.statics.getAllUserAchievements =  async(userId, facilityId)=>{
   
        if (!isMongoId(userId)) throw ({statusCode: 400});
        let  userFacilities;
        if (!facilityId) {
            userFacilities = await UserFacility.find({userId}).distinct('_id');
        } else if (!isMongoId(facilityId)){
            throw({statusCode:400});
        }else{
            userFacilities = await UserFacility.find({userId,facilityId}).distinct('_id');
        }
        return new Promise((resolve,reject)=>{
            UserAchievement.aggregate([
                {
                    $match: {
                        'userFacilityId': {
                            $in: userFacilities
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'achievements', // collection name in db
                        localField: 'achievementId',
                        foreignField: '_id',
                        as: 'achievement'
                    }
                },
                { $match: { 'achievement.status': "active" } },
                { $unwind: '$achievement' },
    
                {
                    $lookup: {
                        from: 'user_facilities',
                        localField: 'userFacilityId',
                        foreignField: '_id',
                        as: 'user_facility'
                    }
                },
                { $unwind: '$user_facility' },
    
                {
                    $lookup: {
                        from: 'facilities',
                        localField: 'user_facility.facilityId',
                        foreignField: '_id',
                        as: 'facility'
                    }
                },
                { $unwind: '$facility' },
    
                {
                    $project: {
                        '_id': 1,
                        'achievement.name': 1,
                        'achievement.description': 1,
                        'achievement.imageUrl': 1,
                        'facility._id': 1,
                        'facility.name': 1,
                        'dateOfAchivied': 1,
                        'status': 1,
                        'dateOfClaim': 1
                    }
                },
                { $sort: { 'dateOfAchivied': 1 } }
            ]).exec((err, userAchievements) => {
                err ? reject(err) : resolve(userAchievements);
            });
        });
        
    };
    


const UserAchievement = mongoose.model('user_achievements', userAchievementsSchema);
module.exports = UserAchievement;