const validateRequiredFields = require('./validateRequiredFields');

// This is wherre Stripe API should go should be async, but for linting purposes its off.
const validatePaymentPayload =  (data, membership) => {

  const { price } = data;

  const result = validateRequiredFields(data, [
    'number',
    'exp',
    'CVV',
    'cardholder',
    'price',
  ]);


  if(!result) throw ({statusCode: 400});
  
  if(price !== membership.price) throw({statusCode: 402});


};




module.exports = validatePaymentPayload;