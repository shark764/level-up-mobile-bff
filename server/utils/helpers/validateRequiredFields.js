function validateRequiredFields(req, fields) {

    let result = true;
    const updates = Object.keys(req);
  
    const mandatoryFields = fields;
  
    for (const mandatoryField of mandatoryFields) {
  
      if (!updates.includes(mandatoryField)) {
        result = false;
      }
  
    }
    return result;
  }


  module.exports = validateRequiredFields;