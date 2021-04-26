const express = require('express')
const ObjectId = require('mongoose').Types.ObjectId
const User = require('../../db/models/User')
const {upload} = require('../../middlewares/upload')
const {s3,s3Actions} = require('../../utils/aws')
const getFileType = require('../../utils/helpers/getFileType')
const validateAccess = require('../../middlewares/validateAccess')
const success = require('../../utils/helpers/response').success
const error = require('../../utils/helpers/response').error
const router = express.Router()

//const uploadSingleFile = upload.single('image')

/// POST /user/avatar
router.post('/user/avatar/', validateAccess, async (req,res) => {
    try {
        
        upload(req, res, function(err) {
            if (!req.file) {
                return res.status(400).json(error({ requestId: req.id, code: 400, message: 'Please upload an image' }))
            }
            if(err) {
                return res.status(400).json(error({ requestId: req.id, code: 400, message: err.message }))
            }
            let fileName = req.user.data._id
            
            let fileType = getFileType(req.file)
            let {uploadAvatar} = s3Actions(fileName,fileType,req.file.buffer);
            s3.upload(uploadAvatar(),async (err,data)=>{
                if (err) {
                    res.status(400).json(error({ requestId: req.id, code: 400, message: err }))
                }
                const user = await User.addAvatar(data.Location, req.user.data._id)
                res
                .status(200)
                .json(success({
                    requestId: req.id, 
                    data: { user }
                }))
            })
        })  
    } catch (err) {
        res.status(400).json(error({ requestId: req.id, code: 400, message: err.message }))
    }
})


module.exports = router