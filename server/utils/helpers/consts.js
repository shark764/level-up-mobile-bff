const DEV_MODE = process.env.PORT? false: true;
const ALREADY_ACHIEVED = 'LUL-MOB010 - User already has that Achievement.';
const ALREADY_CLAIMED = 'LUL-MOB011 - Achievement has been already redeemed.';
const ACHIEVEMENT_NOT_FOUND = 'LUL-MOB000 - Achievement with that ID not found.';
const USER_NOT_IN_FACILITY = 'LUL-MOB004 - User not registered in the specified facility.';


module.exports = {
    DEV_MODE,
    ALREADY_ACHIEVED,
    ALREADY_CLAIMED,
    ACHIEVEMENT_NOT_FOUND,
    USER_NOT_IN_FACILITY,
};