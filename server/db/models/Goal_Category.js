const mongoose = require('mongoose');

const goalCategorySchema = new mongoose.Schema({
    goalCategory:{
        type: String,
        required: true
    },
    imageUrl:{
        type: String,
    },

});

module.exports = mongoose.model('goal_category',goalCategorySchema);