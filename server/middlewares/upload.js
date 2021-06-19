const multer  = require('multer');

const allowedImages = new RegExp(process.env.ALLOWED_IMAGE_TYPES, 'g');

const storage = multer.memoryStorage({
    destination: (req,file,callback)=>{
        callback(null,'');
    }
});

const upload = multer({
    storage,
    limits: { 
        fileSize: parseInt(process.env.ALLOWED_IMAGE_SIZE)
    },
    fileFilter(req, file, cb) {        
        if(!file.originalname.match(allowedImages)) {
            return cb(new Error('Invalid file extension'));
        } 
        cb(undefined, true);
    }
}).single('image');

module.exports = {
    upload
};