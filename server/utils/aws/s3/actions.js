
// Actions host the folder where the image will be stored, s3-architecture.
/*
    id ==> unique name of the photo in the specific folder.
    filetype ===> JPG, PNG, JPEG.
    Buffer ===> Image as Buffe get from `req.file`;
*/
const actions = (id)=>{
const Bucket= process.env.AWS_BUCKET_NAME;
const uploadAvatar = (Body,fileType)=>({
        Bucket,
        Key: `avatars/${id}`,
        Body,
        ContentType: `image/${fileType}`
    });
const getAvatar=()=>({
        Bucket,
        Key: `avatars/${id}`
});

    
    return{
        getAvatar,
        uploadAvatar,
    };
};

module.exports = actions;