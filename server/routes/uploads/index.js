const express = require('express');
const app = express();
const {upload} = require('../../middlewares/upload')
const {s3,s3Actions} = require('../../utils/aws')
const getFileType = require('../../utils/helpers/getFileType')

app.post('/upload',upload,(req,res)=>{
    try{
    let fileType = getFileType(req.file)
    let {uploadAvatar} = s3Actions('myFirstPic',fileType,req.file.buffer);
    s3.upload(uploadAvatar(),(err,data)=>{
        if (err) throw new Error(err)
        res.json(data) 
    })
}catch(e){
    console.log(e);
    res.status(500).json(e)
}
    
})

module.exports = app