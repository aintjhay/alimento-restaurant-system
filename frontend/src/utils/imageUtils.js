// Image utility functions
export const getFoodImage = (imageName) => {
  if (!imageName) return '/images/food/placeholder.jpg';
  if (/^data:image\/(jpeg|png|webp);base64,/i.test(imageName) || /^https?:\/\//i.test(imageName)) return imageName;

  // Preserve compatibility with older Chicken Wings filenames stored in MongoDB.
  const fileName = imageName.replace(/\\/g, '/').split('/').pop();
  const imageAliases = {
    'buffalowings12s(2).jpg': 'BuffaloWings12s_2.jpg',
    'buffalowings12s_2.jpg': 'BuffaloWings12s_2.jpg'
  };
  const aliasedFileName = imageAliases[fileName.toLowerCase()];
  if (aliasedFileName) return `/images/food/${aliasedFileName}`;
  
  // Normalize file extension to lowercase (e.g. .JPG → .jpg) for Linux/Vercel compatibility
  const normalized = imageName.replace(/\.[^./]+$/, ext => ext.toLowerCase());

  // If path already includes /images/, return as-is
  if (normalized.startsWith('/images/')) {
    return normalized;
  }
  
  // If path includes food/, just prepend /images/
  if (normalized.includes('food/')) {
    return `/images/${normalized}`;
  }
  
  // Otherwise construct full path
  return `/images/food/${normalized}`;
};

export const getCategoryIcon = (category) => {
  const icons = {
    'Cocktails': '🍸',
    'Pasta': '🍝',
    'Sandwiches': '🥪',
    'Sides': '🍟',
    'Rice Meals': '🍚',
    'Yogurt Milkshakes': '🥤',
    'Coffee': '☕',
    'Coolers': '🥤'
  };
  return icons[category] || '🍽️';
};

export const getItemColor = (category) => {
  const colors = {
    'Rice Meals': '#D97706',
    'Pasta': '#C2413B',
    'Sandwiches': '#B7791F',
    'Sides': '#E09F3E',
    'Cocktails': '#7C5CFC',
    'Coolers': '#3686A0',
    'Coffee': '#795548',
    'Yogurt Milkshakes': '#C94F7C'
  };
  return colors[category] || '#52736E';
};
