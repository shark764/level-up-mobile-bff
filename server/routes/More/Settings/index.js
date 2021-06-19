const express = require('express');
const app = express();
const UserFacility = require('../../../db/models/User_Facility');
const User = require('../../../db/models/User');
const Memberships = require('../../../db/models/Membership');
const validateAccess = require('../../../middlewares/validateAccess');
const verifyToken = require('../../../middlewares/verifyToken');
const {success} = require('../../../utils/helpers/response');
const {error} = require('../../../utils/helpers/response');
const {ObjectId} = require('mongoose').Types;
const validator = require('validator');

//1. Fetch the user's memberships
app.get('/more/settings/memberships', [validateAccess, verifyToken], async (req, res) => {
    try {
        const { userId } = req.body;

        if (!validator.isMongoId(userId)) {
            return res.status(400).json(error({ requestId: req.id, code: 400 }));
        }

        const result = new Promise((resolve, reject) => {

            const userExist = User.findById(userId);

            userExist.
                then(data => {
                    if (data) {
                        UserFacility.aggregate([
                            {
                                $match: { "userId": ObjectId(userId) }
                            },
                            {
                                $lookup:
                                {
                                    from: "user_memberships",
                                    localField: "facilityId",
                                    foreignField: "userFacilityId",
                                    as: "userMemberships"
                                }
                            },
                            { $unwind: { path: "$userMemberships", preserveNullAndEmptyArrays: true } },
                            {
                                $lookup:
                                {
                                    from: "memberships",
                                    let: { ids: "$userMemberships.membershipId" },
                                    pipeline: [
                                        { $match: { $expr: { $eq: ["$_id", "$$ids"] } } },
                                    ],
                                    as: "membership"
                                }
                            },
                            { $unwind: { path: "$membership", preserveNullAndEmptyArrays: true } },
                            {
                                $project:
                                {
                                    _id: 0,
                                    status: 1,
                                    "userFacilityId": "$_id"
                                    , facilityId: 1
                                    , "buyDate": "$userMemberships.buyDate"
                                    , "price": "$userMemberships.price"
                                    , "expirationDate": "$userMemberships.expirationDate"
                                    , "name": "$membership.name"
                                }
                            }
                        ]).exec((e, data) => {
                            if (e) {
                                reject({ statusCode: 500 });
                            }

                            resolve(data);
                        });
                    }
                    else {
                        reject({ statusCode: 404 });
                    }
                })
                .catch(e => { reject({ statusCode: 500 }); });
        });

        result
            .then(data => res.status(200).json(success({ requestId: req.id, data })))
            .catch(e => res.status(e.statusCode).json(error({ requestId: req.id, code: e.statusCode })));

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
    }
});


//2. Modify membership
app.put('/more/settings/memberships/:membershipId', [validateAccess, verifyToken], async (req, res) => {
    try {
        const { membershipId } = req.params;
        const { userId, benefits, name, price, validPeriod } = req.body;

        if (!validator.isMongoId(userId) || !validator.isMongoId(membershipId)) {
            return res.status(400).json(error({ requestId: req.id, code: 400 }));
        }

        if (!benefits || !name || !price || !validPeriod) {
            return res.status(400).json(error({ requestId: req.id, code: 400 }));
        }

        const result = new Promise((resolve, reject) => {
            const userExist = User.findById(userId);
            userExist
                .then(data => {
                    if (data) {
                        const membership = Memberships.findById(membershipId);
                        membership
                            .then(async (membershipModified) => {
                                if (membershipModified) {
                                    membershipModified.name = name;
                                    membershipModified.price = price;
                                    membershipModified.validPeriod = validPeriod;
                                    benefits.map(item => membershipModified.benefits.push(item));

                                    try {
                                        resolve(await membershipModified.save());
                                    } catch (e) {
                                        reject({ statusCode: 500 });
                                    }
                                }
                                else {
                                    reject({ statusCode: 404 });
                                }
                            })
                            .catch(e => { reject({ statusCode: 500 }); });
                    }
                    else {
                        reject({ statusCode: 404 });
                    }
                })
                .catch(e => { reject({ statusCode: 500 }); });
        });

        result
            .then(data => res.status(200).json(success({ requestId: req.id, data })))
            .catch(e => { res.status(e.statusCode).json(error({ requestId: req.id, code: e.statusCode })); });

    } catch (e) {
        res.status(500).json(error({ requestId: req.id, code: 500, message: e.message ? e.message : e }));
    }
});

module.exports = app;