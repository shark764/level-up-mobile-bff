const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const gameSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'leagues' 
    },

    facilityId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'facilities',
    },

    from: {
        type: Date,
        required: true,
    },

    to: {
        type: Date,
        required: true,
    },

    dateCreated: {
        type: Date,
        required: true,
        default: Date.now()
    },

    dateUpdated: {
        type: Date,
        required: true,
        default: Date.now()
    },

    userCreated: {
        type: String,
        required: true,
    },

    userUpdated: {
        type: String,
        required: true,
    },

    active: {
        type: Boolean,
        required: true,
    }

})

gameSchema.statics.newGame = async function (data, loggedUser) {        
    return new Promise(async (resolve, reject) => {
        const name = data.name
        const game = await Game.findOne({ name })
    
        if (game) {
          return reject('Game name already in used')
        }
        try {
            const gameToCreate = new Game ({
                name: data.name,
                facilityId: ObjectId(data.facilityId),
                leagueId: ObjectId(data.leagueId),
                from: new Date(data.from),
                to: new Date(data.to),
                userCreated: loggedUser,
                userUpdated: loggedUser,
                active: true
            })
            return resolve(
                await gameToCreate.save(gameToCreate)
            )
        } catch (err) {
            return reject(err.message)
        }
    })
}


const Game = mongoose.model('games', gameSchema)

module.exports = Game
