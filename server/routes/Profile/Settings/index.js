const express =require('express');
const app = express();
const avatarRouter = require('./avatar');

app.use('/avatar',avatarRouter);

module.exports = app;