const isValidPhPhone = value => typeof value === 'string' && /^09\d{9}$/.test(value);
const PH_PHONE_MESSAGE = '11 digits required.';
module.exports = { isValidPhPhone, PH_PHONE_MESSAGE };
