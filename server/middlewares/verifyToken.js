
const verifyToken = (req,res,next)=>{
    const id = req.user.data._id
    if(req.query && req.query.userId && req.query.userId === id) return next();
    if(req.body && req.body.userId && req.body.userId === id) return  next(); 
    if(req.params && req.params.userId && req.params.userId === id) return  next();
    if(!req.body && !req.params.userId && !req.query.userId) return next()
    res.status(401).json({success: false, error: "User not allowed to perform this action."})
}

module.exports = verifyToken