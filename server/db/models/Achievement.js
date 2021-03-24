const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const achievementSchema = new mongoose.Schema({
    name: {
            type: String,
            required: true,
    },

    description: {
        type: String,
        required: true,
    },

    parameter: {
            type: Number,
            required: false,
    },

    imageUrl: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        required: true,
        default: 'active'
    }, 
})

achievementSchema.statics.newAchievement = async function (data) {        
    return new Promise(async (resolve, reject) => {
        const name = data.name
        const achievement = await Achievement.findOne({ name })
    
        if (achievement) {
          return reject('Achievement name is already in use')
        }
        const achievementToCreate = new Achievement ({
            name: data.name,
            description: data.description,
            imageUrl: data.imageUrl,
            parameter: data.parameter
        })
    
        try {
            return resolve(
                await achievementToCreate.save(achievementToCreate)
            )
        } catch (err) {
            return reject(err.message)
        }
    })
}


const Achievement = mongoose.model('achievements', achievementSchema)

module.exports = Achievement
