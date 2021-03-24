const mongoose = require('mongoose')

const userPostsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    urlMedia: {
        type: String,
        trim: true
    },
    publishDate: {
        type: Date,
        default: Date.now
    },
    caption: {
        type: String
    },
    title: {
        type: String
    },
    groupsId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'Groups'
    },
    status: {
        type: String
    },
    updatedDate: {
        type: Date,
        default: Date.now
    }
})

// userPostsSchema.static.newPost = async (post) => {
//     const newPost = new UserPosts({
//         urlMedia: post.urlMedia,
//         title: post.title,
//         caption: post.caption        
//     })
    

// }

const UserPosts = mongoose.model('user_posts', userPostsSchema)

module.exports = UserPosts