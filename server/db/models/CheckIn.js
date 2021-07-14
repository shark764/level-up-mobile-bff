const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;

const CheckinSchema = new mongoose.Schema({
    facilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "facilities",
        required: true
    },

    dateCheckIn: {
        type: Date,
        default: Date.now()
    },

    users: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "users",
                required: true
            },
            dateTime: {
                type: Date,
                default: Date.now()
            }
        }
    ]
});

CheckinSchema.statics.setCheckInUser = (inFacilityId, inUserId) => new Promise((resolve, reject) => {

    const existFC = CheckIn.findOne({ facilityId: inFacilityId, dateCheckIn: { $gt: new Date(new Date().setHours(0, 0, 0, 0)) } });

    existFC
        .then(existFirstCheckin => {
            
            let checkinObject;
            if (existFirstCheckin) {
                checkinObject = existFirstCheckin;
            }
            else {
                checkinObject = new CheckIn({
                    facilityId: inFacilityId,
                });
            }
            checkinObject.users.push({ userId: ObjectId(inUserId) });

            try {
                resolve(checkinObject.save());
            }
            catch (e) {
                reject({ statusCode: 500, message: e.message });
            }
        })
        .catch(e => reject({ statusCode: 500, message: e.message}));
});

const CheckIn = mongoose.model('checkin', CheckinSchema);
module.exports = CheckIn;