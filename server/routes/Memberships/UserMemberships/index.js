const express = require('express');
const app = express();
const Facility = require('../../../db/models/Facility');
const UserFacility = require('../../../db/models/User_Facility');
const Membership = require('../../../db/models/Membership');
const verifyPaymentPayload = require('../../../utils/helpers/validatePaymentPayload');
const { createMembership } = require('../helpers');
const { ObjectId } = require('mongoose').Types;
const { error, success } = require('../../../utils/helpers/response');

const {
    validateTokenAlive,
    validateExistenceAccessHeader,
    validateSession,
} = require('../../../middlewares');

// parse various different custom JSON types as JSON
app.use(express.json());


app.post('/free/:facilityId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ], async (req, res) => {

        try {
           
            const { facilityId } = req.params;
            const userId = req.user_id;
            const {code} = await Facility.validateFacility(facilityId);
            if (code !== 200) {
                return res.status(code).json(
                    error({
                        requestId: req.id,
                        code
                    })
                );
            }
                    const freeMembership = await Facility.freeMembership(facilityId);
                    if (freeMembership) {
                        UserFacility.isAlreadyMember(userId, facilityId).then(async () => {
                            const userFacility = new UserFacility({ userId, facilityId,createdBy: userId });
                            await userFacility.save();
                            res.json(success({ requestId: req.id, data: { user_facility: userFacility } }));
                        }).catch(({statusCode,message})=> res.status(statusCode || 500).json(error({requestId: req.id, code: statusCode || 500, message })));
                    } else {
                        // Facility it's not free.
                        res.status(402).json(error({ requestId: req.id, code: 402 }));
                    }
        } catch (err) {
            res.status(err.statusCode|| 500).json(error({ requestId: req.id, code: 500, message: err.message }));
        }

    });

app.post('/:membershipId',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ], async (req, res) => {

        try {
            const { membershipId } = req.params;
            const userId = req.user_id;
            const validationResult = await Membership.validateMembership(membershipId);
            if (validationResult.code !== 200) {
                return res.status(validationResult.code).json(
                    error({
                        requestId: req.id,
                        code: validationResult.code,
                    })
                );
            }

            const paymentPayload = req.body;
            UserFacility.isAlreadyMember(userId, validationResult.membership.facilityId).then(async () => {

                const membership = await  validationResult.membership.populate('facilityId');
                verifyPaymentPayload(paymentPayload, membership);                        
                const newMembership = await createMembership( userId, membership);
                res.json(success({ requestId: req.id, data: { membership: newMembership } }));
                }).catch(e => {
                    res.status(e.statusCode || 500).json(error({ requestId: req.id, code: e.statusCode || 500, message: e.message }));
                });

                

           
        } catch (err) {
            res.status(500).json(error({ requestId: req.id, code: 500, message: err.message }));
        }




    });

// Missing parsing responses in this Endpoint...
app.get('/',
    [
        validateExistenceAccessHeader,
        validateSession,
        validateTokenAlive
    ],  (req, res) => {

        const id = req.user_id;

        UserFacility.aggregate([
            {
                "$match": { "userId": ObjectId(id) }
            },
            {
                "$project": {
                    "_id": 0,
                    "facilityId": 1,
                }
            },

        ]).exec(async (err, memberships) => {
            // console.log("This are memberships",memberships)
            if (err) {
                res.status(500).json(error({ requestId: req.id, code: 500, message: err.message }));
            } else if (memberships.length === 0) {
                // No memberships is not an error.
                res.json(success({ requestId: req.id, data: { memberships } }));
            } else {
                const parsedMemberships = memberships.map(item => item.facilityId);
                const facilities = await Facility.find({ _id: { "$in": parsedMemberships } }, 'name pictures');
                res.json(success({ requestId: req.id, data: { memberships: facilities } }));
            }
        });

    });



module.exports = app;