const mongoose = require('mongoose');

const goalCategorySchema = new mongoose.Schema({
    
    goalCategory:{
        type: String,
        required: true
    },

    imageUrl:{
        type: String
    }

});

const GoalCategory = mongoose.model('goal_category',goalCategorySchema);
module.exports = GoalCategory;