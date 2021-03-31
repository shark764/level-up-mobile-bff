require("dotenv").config()
require('./db')
const express= require('express')
const app = express()
const port = process.env.PORT || 5000
const addRequestId = require('express-request-id')()
const bodyParser = require('body-parser')
const achievementRouter = require('./routes/Achievements')
const leagueRouter = require('./routes/League')
const gameRouter = require('./routes/Games')
const userAchievementsRouter = require('./routes/UserAchievements')
const UserChallengeRouter = require('./routes/UserChallenges')
 
app.use(addRequestId)
app.use(express.json())

app.use(achievementRouter)
app.use(leagueRouter)
app.use(gameRouter)
app.use(userAchievementsRouter)
app.use(UserChallengeRouter)

app.use(require('./routes/FacilityCheckIn'))
app.use(require('./routes/MemberShips'))
app.use(require('./routes/Goals'))
app.use(require('./routes/UserFacilityProfile'))
app.use(require('./routes/Social/user_posts'))
app.use(require('./routes/LeaderBoard'));

app.listen(port,(err)=>{
        if(err)  throw new Error(err);
        console.log("Server running on port:",port)
})
