const AWS = require('aws-sdk');
const s3Actions = require('./actions');
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
    signatureVersion: 'v4',
    region: 'us-east-2'
});




module.exports = {
    s3,
    s3Actions
};