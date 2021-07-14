require("dotenv").config();
require('./db');
const express= require('express');
const app = express();
const port = process.env.PORT || 5000;
const addRequestId = require('express-request-id')();
const bodyParser = require('body-parser');
const leagueRouter = require('./routes/League');
const gameRouter = require('./routes/Games');
const userAchievementsRouter = require('./routes/UserAchievements');
const UserChallengeRouter = require('./routes/UserChallenges');
 
app.use(addRequestId);
app.use(express.json());

app.use(leagueRouter);
app.use(gameRouter);
app.use('/users/:userId/achievements/', userAchievementsRouter);
app.use(UserChallengeRouter);
app.use(require('./routes/FacilityCheckIn'));
app.use(require('./routes/Memberships'));
app.use(require('./routes/Goals'));
app.use(require('./routes/Social'));
app.use(require('./routes/Social/profile'));
app.use(require('./routes/Social/Groups'));
app.use(require('./routes/UserFacilityProfile'));
app.use(require('./routes/Social/user_posts'));
app.use(require('./routes/Social/events'));
app.use(require('./routes/Social/feeds'));
app.use(require('./routes/Social/Invitations'));
app.use(require('./routes/LeaderBoard'));
//app.use(require('./routes/uploads'))
app.use(require('./routes/UserManagement/avatar'));
app.use(require('./routes/More/Settings'));
app.use(require('./routes/SafetyVideo'));



app.listen(port,(err)=>{
        if(err)  throw new Error(err);
        console.log("Server running on port:",port);
});
