const multer  = require('multer');
const storage = multer.memoryStorage({
    destination: (req,file,callback)=>{
        callback(null,'')
    }
});

const upload = multer({storage}).single('image');


module.exports = {
    upload
}