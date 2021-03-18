require("dotenv").config()
require('./db')
const express= require('express')
const app = express();
const port = process.env.PORT || 5000;
const addRequestId = require('express-request-id')();
 
app.use(addRequestId);

app.use(require('./routes/FacilityCheckIn'));
app.use(require('./routes/MemberShips'));
app.use(require('./routes/Goals'))





app.listen(port,(err)=>{
        if(err)  throw new Error(err);
        console.log("Server running on port:",port)
})