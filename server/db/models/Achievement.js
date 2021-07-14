const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    parameter: {
        type: Number,
        required: false
    },

    imageUrl: {
        type: String,
        required: true
    },

    status: {
        type: String,
        required: true,
        default: 'active'
    }
});

achievementSchema.statics.newAchievement = function (data) {

    return new Promise((resolve, reject) => {
        const { name } = data;
        const achievement = Achievement.findOne({ name });

        achievement
            .then(result => {

                if (result) {
                    return reject({ statusCode: 409 });
                }

                const achievementToCreate = new Achievement({
                    name: data.name,
                    description: data.description,
                    imageUrl: data.imageUrl,
                    parameter: data.parameter
                });

                try {
                    return resolve(achievementToCreate.save(achievementToCreate));
                } catch(e) {
                    return reject({ statusCode: 500, message: e.message });
                }
            })
            .catch((e) => reject({ statusCode: 500, message: e.message }));
    });
};


const Achievement = mongoose.model('achievements', achievementSchema);

module.exports = Achievement;
