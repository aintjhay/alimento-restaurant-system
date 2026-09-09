export const PH_PHONE_MESSAGE = '11 digits required.';
export const isValidPhPhone = value => typeof value === 'string' && /^09\d{9}$/.test(value);
export const phPhoneInputProps = {
  type: 'tel', autoComplete: 'tel', inputMode: 'numeric',
  pattern: '09[0-9]{9}', maxLength: 11, minLength: 11,
  placeholder: '09171234567', title: PH_PHONE_MESSAGE, required: true
};
