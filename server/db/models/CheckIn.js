const mongoose = require('mongoose');
const {ObjectId} = require('mongoose').Types;

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

CheckinSchema.statics.setCheckInUser = (inFacilityId, inUserId) => new Promise(async(resolve,reject)=>{

        const existFirstCheckin = await CheckIn.findOne({ facilityId: inFacilityId, dateCheckIn: {$gt: new Date(new Date().setHours(0,0,0,0))} });

        let checkinObject;
        if (existFirstCheckin) {
            checkinObject = existFirstCheckin;
        }
        else {
            checkinObject = new CheckIn({
                facilityId: inFacilityId,
            });
        }
        checkinObject.users.push({userId: ObjectId(inUserId)});

        try{            
            return resolve(await checkinObject.save());
        }
        catch{
            return reject({statusCode: 500});
        }        
    });

const CheckIn = mongoose.model('checkin', CheckinSchema);
module.exports = CheckIn;