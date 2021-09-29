const { s3 } = require("../aws");

const success = (args) => ({
        status: 'success',
        requestId: args.requestId,
        data: args.data || {message: 'Operation was successful.'}
    });

const error = (args) => {
    const {code} = args;
    let message;
    switch(code){
        case 400:
            message ="LUL-MOB000 - Bad request check body/params";
        break;

        case 401:
            message="LUL-MOB001 - Authentication required";
        break;

        case 402:
            message="LUL-MOB002 - Payment required";
        break;

        case 403:
            message="LUL-MOB003 - Forbidden Action";
        break;

        case 404:   
            message ="LUL-MOB004 - Not found";
        break;

        case 409:
            message = "LUL-MOB009 - Resource is already in use";
        break;

        case 422:
            message="LUL-MOB022 - Missing Access Header";
        break;
        
        default:
            message = args.message || 'Server Error';
    }
    return {
        status: 'error',
        requestId: args.requestId,
        error: {
            code: args.code,
            message: args.message || message,
        }
    };
};

const handleImageResponse = (url,action,res,req)=>{
    s3.headObject(action(),async(err)=>{
        if(err) return res.status(err.statusCode || 500).json(error({requestId:req.id, code: err.statusCode || 500 , message: err.message}));
        if(url) return res.json(success({requestId:req.id, data: s3.getSignedUrl('getObject',action())}));
        const {Body} = await s3.getObject(action()).promise();
        res.writeHead(200,{'Content-Type': 'image/jpeg'});
        res.write(Body,'binary');
        res.end(null,'binary');
    });

};


module.exports = { success, error,handleImageResponse };
