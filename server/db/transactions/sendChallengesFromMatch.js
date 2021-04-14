const mongoose = require('mongoose');
const Challenge = require('../models/Challenge')
const UserChallenge = require('../models/User_Challenge')
const UserMatch = require('../models/User_Match')
const validator = require('validator');


const sendChallengesFromMatch = async function (data) {
    
    return new Promise(async (resolve, reject) => {
        const session = await mongoose.startSession()
        try {
            if(!validator.isMongoId(data.matchId) || !validator.isMongoId(data.challengeTo)) reject("Invalid IDS format, please check body payload");
            const match = await UserMatch.findById(data.matchId);
            if(!match) reject("No Match found, check body matchID");
            
            const pendingChallange = await UserChallenge.find({
                matchId: match._id,
                challengeFrom: match.userFacilityId,
                challengeTo: data.challengeTo,
                status: 'pending'
            })

            if (pendingChallange.length > 0) {
                return reject('A similar challenge to that user is still pending')
            }

            session.startTransaction()

            const challengeToCreate = new Challenge ({
                name: data.name,
                gameId: match.gameId,
                matchId: match._id,
                requiredScore: match.score,
                imageUrl: data.imageUrl,
                type: 'user',
                timeFrame: data.timeFrame,
                status: 'active'
            })
            const challenge = await challengeToCreate.save( { session } )

            const userChallengeToCreate = new UserChallenge ({
                challengeId: challenge._id,
                matchId: match._id,
                challengeFrom: match.userFacilityId,
                challengeTo: data.challengeTo,
                status: 'pending'
            })
            const userChallenge = await userChallengeToCreate.save( { session } )
            await session.commitTransaction()
            session.endSession()
            return resolve(
                userChallenge
            )

        } catch (err) {
            await session.abortTransaction()
            session.endSession()
            return reject(err.message)
        }
    })

}

exports.sendChallengesFromMatch = sendChallengesFromMatch;