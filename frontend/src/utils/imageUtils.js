// Image utility functions
export const getFoodImage = (imageName) => {
  if (!imageName) return '/images/food/placeholder.jpg';
  
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
    'Cocktails': '#4DB6AC', // Teal
    'Pasta': '#FF9800',     // Orange
    'Sandwiches': '#795548', // Brown
    'Sides': '#8BC34A',     // Green
    'Rice Meals': '#FF5722', // Deep Orange
    'Yogurt Milkshakes': '#E91E63', // Pink
    'Coffee': '#795548',    // Brown
    'Coolers': '#2196F3'    // Blue
  };
  return colors[category] || '#607D8B';
};