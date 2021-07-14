const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    from: {
        type: Date,
        required: true
    },

    to: {
        type: Date,
        required: true
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
        required: true
    },

    userUpdated: {
        type: String,
        required: true
    },

    active: {
        type: Boolean,
        required: true
    }

});

leagueSchema.statics.newLeague = function (data, loggedUser) {

    return new Promise(async (resolve, reject) => {

        const { name } = data;
        const league = League.findOne({ name });

        league
            .then(result => {

                if (result) {
                    reject({ statusCode: 409 });
                }

                try {
                    const leagueToCreate = new League({
                        name: data.name,
                        from: new Date(data.from),
                        to: new Date(data.to),
                        userCreated: loggedUser,
                        userUpdated: loggedUser,
                        active: true
                    });

                    resolve(leagueToCreate.save(leagueToCreate));

                } catch {
                    reject({ statusCode: 500 });
                }
            })
            .catch(() => reject({ statusCode: 500 }));
    });
};


const League = mongoose.model('leagues', leagueSchema);

module.exports = League;