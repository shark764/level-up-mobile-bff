const DEV_MODE = process.env.PORT? false: true;
const ALREADY_ACHIEVED = 'LUL-MOB009 - User already has that Achievement.';
const ALREADY_CLAIMED = 'LUL-MOB011 - Achievement has been already redeemed.';
const ACHIEVEMENT_NOT_FOUND = 'LUL-MOB004 - Achievement not found.';
const USER_NOT_IN_FACILITY = 'LUL-MOB004 - User/Facility relation not found.';
const USER_MEMBER  = "LUL-MOB009 - User is already a member";
const LIMIT_PAGE_DEFAULT = 2;
const USER_INFORMATION = "firstName lastName birthDate country city";
const HANDLE_BAD_REQUEST = (message)=> `LUL-MOB000 - ${message}`;

module.exports = {
    DEV_MODE,
    ALREADY_ACHIEVED,
    ALREADY_CLAIMED,
    ACHIEVEMENT_NOT_FOUND,
    USER_NOT_IN_FACILITY,
    USER_MEMBER,
    LIMIT_PAGE_DEFAULT,
    USER_INFORMATION,
    HANDLE_BAD_REQUEST
};