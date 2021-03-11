require("dotenv").config()
require('./db')
const express= require('express')
const app = express();
const port = process.env.PORT || 5000;
const {GET_ASYNC,SET_ASYNC} = require('./utils/redis')


// testing...


app.get('/test',async(req,res)=>{
        const reply = await GET_ASYNC('KEY');
        if(reply){
                console.log("Cached Data",reply);
                res.json({reply})
        }else{

        const savedResult = await SET_ASYNC('KEY',"hELLO FER",'EX',10)
        res.json({reply: savedResult});
        }
})




app.listen(port,(err)=>{
        if(err)  throw new Error(err);
        console.log("Server running on port:",port)
})