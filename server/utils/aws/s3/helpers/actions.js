
// Actions host the folder where the image will be stored, s3-architecture.
/*
    id ==> unique name of the photo in the specific folder.
    filetype ===> JPG, PNG, JPEG.
    Buffer ===> Image as Buffe get from `req.file`;
*/
const actions = (id,filetype,Body)=>{

const uploadAvatar = ()=>{
    return{
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `avatars/${id}.${filetype}`,
        Body
    }
}

    return{
        uploadAvatar,
    }
}

module.exports = actions