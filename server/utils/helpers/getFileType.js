const getFileType = (file)=>{
    let myFile = file.originalname.split('.');
    return myFile[myFile.length - 1];
}

module.exports = getFileType