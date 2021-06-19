const mongoose = require('mongoose');

const UsersEventsAttendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'events'
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'groups'
    },
    isInvited: {
        type: Boolean
    },
    isAccepted: {
        type: Boolean
    },
    dateAccepted: {
        type: Date        
    }
});

const Users_Events_Attendance = mongoose.model('users_events_attendance', UsersEventsAttendanceSchema);

module.exports = Users_Events_Attendance;