const express = require('express');
const app = express();
const User = require('../../db/models/User');
const {error,success} = require('../../utils/helpers/response');
app.get('/leaderboard',async(req,res)=>{
   try{
    //    userId sent on payload
        const {userId} = req.body;
        if(userId){
            const results = await User.leaderBoard();
            User.getGlobalRank(userId).then(result=>{
                res.json(success({reqId: req.id, data: {results, result}}));
            }).catch(e=>{
                res.status(500).json(error({reqId: req.id, code: 500, message: e.message}));
            });

        }else{
            // Missing ID of userId;
            res.status(400).json(error({reqId: req.id, code: 400, message: "Missing userId sent on payload"}));
        }
   }catch(e){
    res.status(500).json(error({reqId: req.id, code: 500, message: e}));
   }
});

module.exports = app;