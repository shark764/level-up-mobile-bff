const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const leagueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
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

leagueSchema.statics.newLeague = async function (data, loggedUser) {        
    return new Promise(async (resolve, reject) => {
        const name = data.name
        const league = await League.findOne({ name })
    
        if (league) {
          return reject('League name already in used')
        }
        const leagueToCreate = new League ({
            name: data.name,
            from: new Date(data.from),
            to: new Date(data.to),
            userCreated: loggedUser,
            userUpdated: loggedUser,
            active: true
        })
    
        try {
            return resolve(
                await leagueToCreate.save(leagueToCreate)
            )
        } catch (err) {
            return reject(err.message)
        }
    })
}


const League = mongoose.model('leagues', leagueSchema)

module.exports = League