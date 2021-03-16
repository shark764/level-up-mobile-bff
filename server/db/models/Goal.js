const mongooose = require('mongoose');

const goalSchema = new mongooose.Schema({
    goalName:{
        type: String,
        required: true,
        unique: true,
    },

    goalCategoryId:{
        type: mongooose.Schema.Types.ObjectId,
        ref: 'goal_categories',
        required: true,
    },

    imageUrl:{
        type: String,
    },

})

module.exports = mongooose.model('goal',goalSchema);