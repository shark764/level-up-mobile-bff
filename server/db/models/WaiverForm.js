const mongoose = require('mongoose');
const WaiverFormSchema = require('./schemas/WaiverForm');

const WaiverForm = mongoose.model('waiver_forms', WaiverFormSchema);
module.exports = WaiverForm;
