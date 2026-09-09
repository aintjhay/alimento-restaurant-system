import { prepareMenuImage } from './menuImage';
import { getFoodImage } from './imageUtils';

test('rejects unsupported and oversized files', async () => {
  await expect(prepareMenuImage({ type: 'image/svg+xml', size: 10 })).rejects.toThrow('JPG, PNG, or WebP');
  await expect(prepareMenuImage({ type: 'image/jpeg', size: 11 * 1024 * 1024 })).rejects.toThrow('10 MB');
});

test('uploaded photos and legacy filenames resolve correctly', () => {
  const image = 'data:image/jpeg;base64,AbC/DeF';
  expect(getFoodImage(image)).toBe(image);
  expect(getFoodImage('food/Latte.JPG')).toBe('/images/food/Latte.jpg');
});
