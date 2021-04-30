const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

const CheckinSchema = new mongoose.Schema({
    facilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "facilities",
        required: true
    },

    dateCheckIn:{
        type: Date,
        default: Date.now()
    },

    users: [
        {
            userId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "users",
                required: true
            },
            dateTime:{
                type: Date,
                default: Date.now()
            }
        }
    ]
});

CheckinSchema.statics.setCheckInUser = (inFacilityId, inUserId) => {

    return new Promise(async(resolve,reject)=>{

        existFirstCheckin = await CheckIn.findOne({ facilityId: inFacilityId, dateCheckIn: {$gt: new Date(new Date().setHours(0,0,0,0))} });

        if (existFirstCheckin) {
            checkinObject = existFirstCheckin;
            checkinObject.users.push({userId: ObjectId(inUserId)})
        }
        else {
            checkinObject = new CheckIn({
                facilityId: inFacilityId,
            });
            checkinObject.users.push({userId: ObjectId(inUserId)})
        }

        try{
            await checkinObject.save();
            return resolve(`Check in for user ${inUserId} in Facility ${inFacilityId} was added successfully`);
        }
        catch(e){
            return reject(e.message);
        }        
    });
}

const CheckIn = mongoose.model('checkin', CheckinSchema);
module.exports = CheckIn;