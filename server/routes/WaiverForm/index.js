const express = require('express');
const validator = require('validator');
const multer = require('multer');
const { ObjectId } = require('mongoose').Types;

const router = express.Router();
const Facility = require('../../db/models/Facility');

const WaiverForm = require('../../db/models/WaiverForm');
const { success, error } = require('../../utils/helpers/response');
const {
  validateSession,
  validateTokenAlive,
  validateExistenceAccessHeader,
} = require('../../middlewares');

const { s3 } = require('../../utils/aws');
const getFileType = require('../../utils/helpers/getFileType');

router.get(
  '/waiverforms/:facilityId',
  // Security middleware
  [validateExistenceAccessHeader, validateSession, validateTokenAlive],
  // Getting file from S3
  // and checking form is signed
  async (req, res) => {
    const { facilityId } = req.params;
    const userId = req.user_id;
    if (!validator.isMongoId(facilityId)) {
      return res.status(400).json(error({ requestId: req.id, code: 400 }));
    }

    const fileType = 'pdf';
    // Root folder
    const foldername = 'waiverforms';

    const facility = await Facility.findById(facilityId);
    if (facility) {
      // Facility exists
      // Facility has a waiver form active and it's not expired?
      const activeFacWaiverForm = await WaiverForm.findOne({
        facilityId: ObjectId(facilityId),
        status: true,
        dueDate: { $gt: new Date(new Date().setUTCHours(23, 59, 59, 59)) },
      });
      if (activeFacWaiverForm) {
        // Facility has an active waiver form
        // Check if user already signed waiver form
        const userSigned = activeFacWaiverForm.users.find(
          (u) => u.userId === userId
        );
        if (userSigned) {
          // User already signed form
          // We return just a status "true"
          res.json(
            success({ requestId: req.id, data: { signed_status: true } })
          );
        } else {
          // User hasn't signed form
          // Retrieve template from S3 and send it as response
          // Filename: facilityId-createdAt.pdf
          const fileName = `${facilityId}-${activeFacWaiverForm.createdAt}.${fileType}`;
          const getParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            // Path: "waiverforms/facilityId/file"
            // Example: "waiverforms/604a5603c76927376416843a/604a5603c76927376416843a-1632156453489.pdf"
            Key: `${foldername}/${facilityId}/${fileName}`,
          };
          try {
            // Attempt to retrieve facility active form
            const file = await s3.getObject(getParams).promise();
            res.json(success({ requestId: req.id, data: file.Body }));
          } catch (e) {
            // An error ocurred while retrieving from S3
            res.status(400).json(
              error({
                requestId: req.id,
                code: 400,
                message: e.message,
              })
            );
          }
        }
      } else {
        // Facility doesn't have an active form
        // Using DEFAULT instead
        const defaultWaiverForm = await WaiverForm.findOne({
          facilityId: null,
          status: true,
        });
        if (defaultWaiverForm) {
          // There is an active default form
          // It's not attached to any facility and doesn't have due date
          // Check if user already signed waiver form
          const userSigned = defaultWaiverForm.users.find(
            (u) => u.userId === userId
          );
          if (userSigned) {
            // User already signed form
            // We return just a status "true"
            res.json(
              success({ requestId: req.id, data: { signed_status: true } })
            );
          } else {
            // User hasn't signed form
            // Retrieve template from S3 and send it as response
            // Filename: default.pdf
            const fileName = `default.${fileType}`;
            const getParams = {
              Bucket: process.env.AWS_BUCKET_NAME,
              // Path: "waiverforms/file"
              // Example: "waiverforms/default.pdf"
              Key: `${foldername}/${fileName}`,
            };
            try {
              // Attempt to retrieve default active form
              const file = await s3.getObject(getParams).promise();
              res.json(success({ requestId: req.id, data: file.Body }));
            } catch (e) {
              // An error ocurred while retrieving from S3
              res.status(400).json(
                error({
                  requestId: req.id,
                  code: 400,
                  message: e.message,
                })
              );
            }
          }
        } else {
          // There isn't any default waiverform
          // Or none is active
          res.status(404).json(
            error({
              requestId: req.id,
              code: 404,
              message: 'No default waiver form found',
            })
          );
        }
      }
    } else {
      // Facility doesn't exist
      res.status(404).json(error({ requestId: req.id, code: 404 }));
    }
  }
);

const preUpload = (req, res, next) => {
  const userId = req.user_id;
  const uploadDateTime = Date.now();
  req.uploadDateTime = uploadDateTime;
  req.waiverFormFilename = `${userId}-${uploadDateTime}`;
  next();
};

const storage = multer.memoryStorage({
  destination(req, file, callback) {
    callback(null, '');
  },
  // filename: (req, file, cb) => {
  //   cb(null, `${req.waiverFormFilename}.pdf`);
  // },
});

const uploadStorage = multer({ storage });

router.post(
  '/waiverforms/:facilityId',
  // Security middleware
  [validateExistenceAccessHeader, validateSession, validateTokenAlive],
  // Settings before handling file
  preUpload,
  // Handling file with multer
  uploadStorage.single('file'),
  // Uploading to S3 and updating mongodb
  async (req, res) => {
    const { facilityId } = req.params;
    const userId = req.user_id;
    if (!validator.isMongoId(facilityId)) {
      return res.status(400).json(error({ requestId: req.id, code: 400 }));
    }
    // Uploaded file
    const {
      file,
      waiverFormFilename: fileName,
      uploadDateTime: dateTime,
    } = req;
    const fileType = getFileType(file);
    // Root folder
    const foldername = 'waiverforms';
    const getParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      // Path: "waiverforms/facilityId/file"
      // Example: "waiverforms/604a5603c76927376416843a/6140cdbc88caf9000f67a5a6-1632156453489.pdf"
      Key: `${foldername}/${facilityId}/${fileName}.${fileType}`,
      Body: file.buffer,
    };

    const facility = await Facility.findById(facilityId);
    if (facility) {
      // Facility exists
      // Insert new Waiver Form
      // We add the user to waiver form of facility
      const waiverFormNewUser = {
        userId,
        dateTime,
      };

      try {
        // First, we attempt to update waiverform for facility
        // Pushing a new user to "users" subcollection
        const updated = await WaiverForm.findOneAndUpdate(
          {
            facilityId: ObjectId(facilityId),
            status: true,
            dueDate: { $gt: new Date(new Date().setUTCHours(23, 59, 59, 59)) },
          },
          { $push: { users: waiverFormNewUser } },
          { new: true }
        );
        // If a document was updated, then we upload to S3
        if (updated) {
          // User signed form
          // Upload file to S3 to /waiverforms/facilityId/
          // We return just a status "true"
          try {
            // Upload to S3
            // We are using default params for facility waiverform
            await s3.upload(getParams).promise();
            res.json(
              success({
                requestId: req.id,
                data: {
                  signed_status: true,
                  msg: 'Signed form uploaded successfully',
                },
              })
            );
          } catch (e) {
            // Failed to upload form to S3
            // Using facility form
            res.status(400).json(
              error({
                requestId: req.id,
                code: 400,
                message: e.message,
              })
            );
          }
        } else {
          // No entry for facility, then we use the default one
          // The default one doesn't have a facility attached to it
          const defaultUpdated = await WaiverForm.findOneAndUpdate(
            { facilityId: null, status: true },
            { $push: { users: waiverFormNewUser } },
            { new: true }
          );
          // If a document was updated, then we upload to S3
          if (defaultUpdated) {
            // User signed form
            // Upload file to S3 to /waiverforms/
            // We return just a status "true"
            try {
              // Upload to S3
              // We change params to point to right folder
              // Since user didn't sign the form of facility
              await s3
                .upload({
                  ...getParams,
                  // Path: "waiverforms/file"
                  // Example: "waiverforms/6140cdbc88caf9000f67a5a6-1632156453489.pdf"
                  Key: `${foldername}/${fileName}.${fileType}`,
                })
                .promise();

              res.json(
                success({
                  requestId: req.id,
                  data: {
                    signed_status: true,
                    msg: 'Default template signed and uploaded successfully',
                  },
                })
              );
            } catch (e) {
              // Failed to upload file to S3
              // using default waiver form to S3
              res.status(400).json(
                error({
                  requestId: req.id,
                  code: 400,
                  message: e.message,
                })
              );
            }
          } else {
            // There isn't any default waiverform
            // Or none is active
            res.status(404).json(
              error({
                requestId: req.id,
                code: 404,
                message: 'No default waiver form found',
              })
            );
          }
        }
      } catch (e) {
        // Failed to update in mongoose
        // Or any other of the below process not catch in nested try/catch
        res.status(400).json(
          error({
            requestId: req.id,
            code: 400,
            message: e.message,
          })
        );
      }
    } else {
      // Facility doesn't exist
      res.status(404).json(error({ requestId: req.id, code: 404 }));
    }
  }
);

module.exports = router;
