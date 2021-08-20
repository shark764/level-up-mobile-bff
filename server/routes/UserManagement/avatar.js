const express = require('express');
const {ObjectId} = require('mongoose').Types;
const User = require('../../db/models/User');
const {upload,validateExistenceAccessHeader,validateSession,validateTokenAlive} = require('../../middlewares');
const {s3,s3Actions} = require('../../utils/aws');
const getFileType = require('../../utils/helpers/getFileType');
const {success} = require('../../utils/helpers/response');
const {error} = require('../../utils/helpers/response');
const multer = require('multer');
const router = express.Router();

//const uploadSingleFile = upload.single('image')

/// POST /user/avatar
router.post('/user/avatar/', [ 
    validateExistenceAccessHeader,
    validateSession,
    validateTokenAlive],  (req,res) => {
    try {
        
        upload(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json(error({ requestId: req.id, code: 400, message: 'Image exceeds the size limit' }));    
                }
                return res.status(400).json(error({ requestId: req.id, code: 400, message: 'There is a problem uploading your image' }));
            } else if (err) {                
                return res.status(400).json(error({ requestId: req.id, code: 400, message: err.message }));
            }
            if (!req.file) {
                return res.status(400).json(error({ requestId: req.id, code: 400, message: 'Please upload an image' }));
            }
            const fileName = req.user_id;
            
            const fileType = getFileType(req.file);
            const {uploadAvatar} = s3Actions(fileName,fileType,req.file.buffer);
            s3.upload(uploadAvatar(),async (err,data)=>{
                if (err) {
                    res.status(400).json(error({ requestId: req.id, code: 400, message: err }));
                }
                const user = await User.addAvatar(data.Location, req.user.data._id);
                res
                .status(200)
                .json(success({
                    requestId: req.id, 
                    data: { user }
                }));
            });
        });  
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err.message }));
    }
});


module.exports = router;