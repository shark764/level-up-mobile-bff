const express = require('express');
const app = express();
const UserAchievementsRouter = require('./UserAchievements');
app.use("/users/:userId/achievements",UserAchievementsRouter);

module.exports = app;