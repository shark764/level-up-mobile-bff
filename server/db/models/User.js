const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
       
    },
    password: {
        type: String,        
        required: false,
        minlength: 5
    },
    businessName: {
        type: String,
        //required: false,
        trim: true
    },
    firstName: {
        type: String,
        required: false,
        trim: true
    },
    lastName: {
        type: String,
        required: false,
        trim: true
    },
    displayName: {
        type: String,
        required: false,
        trim: true
    }, 
    providerId: {
        type: String,
        trim: true
    },
    provider: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    active: {
        type: Boolean,
        required: true
    }
})


// find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// find user by id
userSchema.statics.getUserById = async (id) => {
    //const userId = mongoose.Types.ObjectId(id)
    const user =  User.findById(id, (err, user)=> {
        
    })
    return user;
    

}




const User = mongoose.model('User', userSchema)

module.exports = User
