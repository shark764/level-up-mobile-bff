const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

const GroupSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },

    groupName:{
        type: String
    },

    description:{
        type: String
    },

    coverPhoto:{
        type: String
    },

    privacySettings:{
        type: String
    },

    status:{
        type: String
    },

    userMembers: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "users"
            },

            isAdmin: {
                type: Boolean
            },

            status: {
                type: String,
                default: 'pending'
            },

            dateAccepted: {
                type: Date
            }
        }
    ]
})

GroupSchema.statics.getTotalUserMembers = (inGroupId) => {

    return new Promise((resolve,reject)=>{
        Group.aggregate([
            { $unwind: "$userMembers"},
            { 
                $match: 
                {
                    $expr:
                    {
                        $and:
                        [
                            { $eq: ["$_id",inGroupId] },
                            { $eq: ["$userMembers.status","accepted"]}
                        ]
                    } 
                }
            }
        ]).exec((error,result)=>{
            if(error){
                reject(error);
            }
            else{
                resolve(result.length);
            }
        });
    });
}

const Group = mongoose.model('group',GroupSchema);
module.exports = Group;