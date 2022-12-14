require('dotenv').config();
require('./db');
const express = require('express');

const app = express();
const port = process.env.PORT || 4000;
const addRequestId = require('express-request-id')();
const gameRouter = require('./routes/Games');
const Achievements = require('./routes/Achievements');
const UserChallengeRouter = require('./routes/UserChallenges');
const ProfileRouter = require('./routes/Profile');
 
app.use(addRequestId);
app.use(express.json());
app.use(gameRouter);
app.use(Achievements);
app.use(UserChallengeRouter);
app.use('/facilities',require('./routes/FacilityCheckIn'));
app.use(require('./routes/Memberships'));
app.use(require('./routes/Goals'));
app.use(require('./routes/Social'));
app.use(require('./routes/Social/profile'));
app.use(require('./routes/Social/Groups'));
app.use(require('./routes/Profile'));
app.use(require('./routes/Social/user_posts'));
app.use(require('./routes/Social/events'));
app.use(require('./routes/Social/feeds'));
app.use(require('./routes/Social/Invitations'));
app.use(require('./routes/LeaderBoard'));
app.use('/userprofile',ProfileRouter);
//app.use(require('./routes/uploads'))
app.use(require('./routes/More/Settings')); 
app.use(require('./routes/Users'));
app.use(require('./routes/WaiverForm'));

app.listen(port, (err) => {
  if (err) throw new Error(err);
  console.log('Server running on port:', port);
});
