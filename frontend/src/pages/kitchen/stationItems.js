const BAR_CATEGORIES = ['Cocktails', 'Yogurt Milkshakes', 'Coffee', 'Coolers'];
const KITCHEN_CATEGORIES = ['Pasta', 'Sandwiches', 'Sides', 'Rice Meals'];
export const isBarItem = (item) => {
    // Primary check: use category if available
    if (item.category && BAR_CATEGORIES.includes(item.category)) {
      return true;
    }
    
    // Fallback: keyword matching for items without category
    const itemName = (item.name || '').toLowerCase();
    const drinkKeywords = [
      'cocktail', 'mojito', 'margarita', 'daiquiri', 'cosmopolitan', 'martini',
      'milkshake', 'yogurt', 'shake', 'smoothie',
      'coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'mocha', 'macchiato',
      'cooler', 'iced', 'juice', 'lemonade', 'soda', 'tea', 'frappe',
      'beer', 'wine', 'sangria', 'spritz', 'negroni', 'old fashioned',
      'mango', 'strawberry', 'blueberry', 'matcha', 'chocolate drink',
      'sunrise', 'sunset', 'tropical', 'paradise', 'blue lagoon'
    ];
    return drinkKeywords.some(keyword => itemName.includes(keyword));
  };

export const isKitchenItem = (item) => {
    const itemName = (item.name || '').toLowerCase();
    const foodKeywords = [
      'pasta', 'spaghetti', 'carbonara', 'bolognese', 'aglio', 'pesto',
      'sandwich', 'club', 'grilled', 'panini', 'blt', 'wrap',
      'rice', 'meal', 'adobo', 'sinigang', 'sisig', 'fried', 'chicken',
      'fries', 'nachos', 'wings', 'calamari', 'bruschetta', 'salad',
      'soup', 'garlic bread', 'mozzarella', 'spring rolls', 'side'
    ];
    if (item.category && KITCHEN_CATEGORIES.includes(item.category)) return true;
    return foodKeywords.some(keyword => itemName.includes(keyword));
  };
