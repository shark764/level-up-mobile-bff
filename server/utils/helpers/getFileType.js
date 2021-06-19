const getFileType = (file)=>{
    const myFile = file.originalname.split('.');
    return myFile[myFile.length - 1];
};

module.exports = getFileType;