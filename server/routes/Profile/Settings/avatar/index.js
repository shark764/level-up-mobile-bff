const express = require('express');
const {isMongoId} = require('validator');
const User = require('../../../../db/models/User');
const {s3,s3Actions} = require('../../../../utils/aws');
const getFileType = require('../../../../utils/helpers/getFileType');
const {validateExistenceAccessHeader,validateSession,validateTokenAlive,upload} =require('../../../../middlewares');
const {success,error,handleImageResponse} = require('../../../../utils/helpers/response');
const { HANDLE_BAD_REQUEST } = require('../../../../utils/helpers/consts');
const router = express.Router();

// post

router.post('/', [ 
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive],  
    (req,res) => {
    try {
        upload(req, res, async(err) => {
           if(!req.file || err) return res.status(400).json(error({requestId:req.id,code:400, message: err && HANDLE_BAD_REQUEST(err.message)}));
            const fileName = req.user_id;
            const fileType = getFileType(req.file);
            const {uploadAvatar,getAvatar} = s3Actions(fileName);
            const [,uploadResult] =  await Promise.all([
                s3.deleteObject(getAvatar()).promise(),
                s3.upload(uploadAvatar(req.file.buffer,fileType)).promise()
            ]);
           const user = await User.addAvatar(uploadResult.Location, fileName);
           res.json(success({requestId:req.id,data:{user}}));
        });  
    } catch (err) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: err.message }));
    }
});

router.get('/',[
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive
],(req,res)=>{
    try{
        const userId = req.query.user || req.user_id;
        const {url} = req.query;
        if(!isMongoId(userId)) throw({statusCode:400});
        const {getAvatar} = s3Actions(userId);
        handleImageResponse(url,getAvatar,res,req);
    }catch(e){
        res.status(e.statusCode || 500).json(error({requestId:req.id,code: e.statusCode || 500, message: e.statusCode!==404 && e.message }));
    }
});
module.exports = router;