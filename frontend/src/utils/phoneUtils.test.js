import { isValidPhPhone } from './phoneUtils';

test.each(['09171234567', '09991234567'])('accepts complete number %s', value => {
  expect(isValidPhPhone(value)).toBe(true);
});
test.each(['', '0917', '0917123456', '091712345678', '12345678901', '0917abcdefg', '+639171234567', null])('rejects invalid number %s', value => {
  expect(isValidPhPhone(value)).toBe(false);
});
