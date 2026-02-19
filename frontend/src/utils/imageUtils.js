// Image utility functions
export const getFoodImage = (imageName) => {
  if (!imageName) return '/images/food/placeholder.jpg';
  
  // If path already includes /images/, return as-is
  if (imageName.startsWith('/images/')) {
    return imageName;
  }
  
  // If path includes food/, just prepend /images/
  if (imageName.includes('food/')) {
    return `/images/${imageName}`;
  }
  
  // Otherwise construct full path
  return `/images/food/${imageName}`;
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