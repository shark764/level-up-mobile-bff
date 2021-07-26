const validateRequiredFields = require('./validateRequiredFields');

const validatePaymentPayload = async (data, membership) => {

  const { price } = data;

  const result = validateRequiredFields(data, [
    'number',
    'exp',
    'CVV',
    'cardholder',
    'price',
  ]);


  if(!result) throw ({statusCode: 400})
  
  if(price !== membership.price) throw({statusCode: 402})}




module.exports = validatePaymentPayload;