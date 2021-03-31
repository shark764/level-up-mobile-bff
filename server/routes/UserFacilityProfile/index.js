const express = require('express')
const app = express();
const User = require('../../db/models/User')
const {error,success} = require('../../utils/helpers/response')


app.get('/userprogress/:userId',async(req,res)=>{
    try{
         const {facilityId} = req.body;
        // User.getRankByFacility(req.params.userId, facilityId).then(result=>{
        //     res.json(success({requestId: req.id, data:{result}}))
        // }).catch(e=>{
        //    res.status(500).json({requestId: req.id, code:500, message: e})
        // });

     User.getGlobalRank(req.params.userId).then(result=>{
         res.json(success({requestId: req.id, data:{result}}))
     }).catch(e=>{
         res.status(500).json({requestId: req.id, code: 500, message:e})
     })
        
   
       
    }catch(err){
        res.status(500).json(error({requestId: req.id, code:500, message: err}))
    }
})

module.exports = app