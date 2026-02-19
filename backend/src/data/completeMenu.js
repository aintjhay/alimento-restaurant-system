// Complete Alimento menu with modifiers and images
const completeMenu = [
  // ================ COCKTAILS ================
  {
    name: "TEQUILA SUNRISE",
    description: "Vibrant tequila cocktail with orange juice and grenadine",
    price: 120,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic", "popular"],
    displayOrder: 1
  },
  {
    name: "MOJITO",
    description: "Refreshing Cuban cocktail with mint, lime, and rum",
    price: 120,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic", "refreshing"],
    displayOrder: 2
  },
  {
    name: "AMARETTO SOUR",
    description: "Sweet and sour cocktail with amaretto liqueur",
    price: 120,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic"],
    displayOrder: 3
  },
  {
    name: "WHISKY-RETTO",
    description: "Classic whisky cocktail with a twist",
    price: 120,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic"],
    displayOrder: 4
  },
  {
    name: "FROZEN BLUEBERRY DAIQUIRI",
    description: "Frozen rum cocktail with fresh blueberries",
    price: 120,
    category: "Cocktails",
    image: "",
    preparationTime: 10,
    tags: ["alcoholic", "frozen", "sweet"],
    displayOrder: 5
  },
  {
    name: "BLUE LAGOON",
    description: "Vibrant blue vodka cocktail with lemonade",
    price: 120,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic", "colorful"],
    displayOrder: 6
  },
  {
    name: "MARGARITA",
    description: "Classic tequila cocktail with lime and salt rim",
    price: 110,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic", "classic"],
    displayOrder: 7
  },
  {
    name: "PURPLE HEARTS",
    description: "Violet-colored cocktail with berry flavors",
    price: 100,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic"],
    displayOrder: 8
  },
  {
    name: "WHISKY SOUR",
    description: "Classic whisky cocktail with lemon and sugar",
    price: 90,
    category: "Cocktails",
    image: "",
    preparationTime: 8,
    tags: ["alcoholic"],
    displayOrder: 9
  },
  {
    name: "WHISKY COKE",
    description: "Simple whisky mixed with Coca-Cola",
    price: 90,
    category: "Cocktails",
    image: "",
    preparationTime: 5,
    tags: ["alcoholic"],
    displayOrder: 10
  },
  {
    name: "GIN TONIC",
    description: "Classic gin and tonic with lime",
    price: 90,
    category: "Cocktails",
    image: "",
    preparationTime: 5,
    tags: ["alcoholic"],
    displayOrder: 11
  },
  {
    name: "TEQUILA SHOT",
    description: "Straight tequila shot with lime and salt",
    price: 50,
    category: "Cocktails",
    image: "",
    preparationTime: 2,
    tags: ["alcoholic"],
    displayOrder: 12
  },

  // ================ PASTA ================
  {
    name: "CHORIZO JALAPENO",
    description: "Spicy pasta with chorizo and jalapeño peppers",
    price: 200,
    category: "Pasta",
    image: "food/Chorizojalapeno.jpg",
    preparationTime: 15,
    tags: ["spicy", "popular"],
    displayOrder: 1
  },
  {
    name: "CLASSIC CARBONARA",
    description: "Creamy pasta with bacon, egg, and parmesan",
    price: 220,
    category: "Pasta",
    image: "food/Classiccarbonara.jpg",
    preparationTime: 15,
    tags: ["creamy", "classic"],
    displayOrder: 2
  },
  {
    name: "SPANISH STYLE",
    description: "Spanish-inspired pasta with chorizo and paprika",
    price: 190,
    category: "Pasta",
    image: "food/SpanishStyle.jpg",
    preparationTime: 15,
    tags: ["spicy"],
    displayOrder: 3
  },
  {
    name: "FILIPINO STYLE",
    description: "Local Filipino-style pasta with a sweet twist",
    price: 190,
    category: "Pasta",
    image: "food/Pinoystyle.jpg",
    preparationTime: 15,
    tags: ["sweet", "local"],
    displayOrder: 4
  },
  {
    name: "SEAFOOD PASTA",
    description: "Pasta with mixed seafood in white wine sauce",
    price: 220,
    category: "Pasta",
    image: "",
    preparationTime: 20,
    tags: ["seafood"],
    displayOrder: 5
  },

  // ================ SANDWICHES ================
  {
    name: "THICK CUT BACON",
    description: "Sandwich with thick-cut bacon and fresh vegetables",
    price: 180,
    category: "Sandwiches",
    image: "food/ThickCutBacon.jpg",
    preparationTime: 12,
    tags: ["bacon", "popular"],
    displayOrder: 1,
    addons: [
      {
        name: "Add Cajun Fries",
        price: 50
      }
    ]
  },
  {
    name: "CRISPY CHIX",
    description: "Crispy chicken sandwich with your choice of sauce",
    price: 170,
    category: "Sandwiches",
    image: "food/CrispyChix.jpg",
    preparationTime: 15,
    tags: ["chicken", "popular"],
    displayOrder: 2,
    modifiers: [
      {
        name: "Flavor",
        required: true,
        options: [
          { name: "Buffalo", price: 0 },
          { name: "BBQ", price: 0 }
        ]
      }
    ],
    addons: [
      {
        name: "Add Cajun Fries",
        price: 50
      }
    ]
  },
  {
    name: "CHORI CHEESEBURGER",
    description: "Burger with chorizo patty and melted cheese",
    price: 180,
    category: "Sandwiches",
    image: "food/Choricheeseburger.jpg",
    preparationTime: 15,
    tags: ["chorizo", "burger"],
    displayOrder: 3,
    addons: [
      {
        name: "Add Cajun Fries",
        price: 50
      }
    ]
  },
  {
    name: "BBQ CHEESEBURGER",
    description: "Classic cheeseburger with BBQ sauce",
    price: 190,
    category: "Sandwiches",
    image: "",
    preparationTime: 15,
    tags: ["burger", "bbq"],
    displayOrder: 4,
    addons: [
      {
        name: "Add Cajun Fries",
        price: 50
      }
    ]
  },

  // ================ SIDES ================
  {
    name: "NACHORIZO",
    description: "Nachos with chorizo, cheese, and toppings",
    price: 190,
    category: "Sides",
    image: "food/Nachorizo.jpg",
    preparationTime: 10,
    tags: ["chorizo", "snack"],
    displayOrder: 1
  },
  {
    name: "CAJUN FRIES",
    description: "Crispy fries with cajun seasoning",
    price: 130,
    category: "Sides",
    image: "",
    preparationTime: 8,
    tags: ["fries", "snack"],
    displayOrder: 2
  },
  {
    name: "CHICKEN WINGS",
    description: "Crispy chicken wings with your choice of flavor",
    price: 260,
    category: "Sides",
    image: "food/BuffaloWings12(2).jpg",
    preparationTime: 20,
    tags: ["chicken", "popular"],
    displayOrder: 3,
    modifiers: [
      {
        name: "Size",
        required: true,
        options: [
          { name: "8pcs", price: 260 },
          { name: "12pcs", price: 350 }
        ]
      },
      {
        name: "Flavor",
        required: true,
        options: [
          { name: "Buffalo", price: 0 },
          { name: "BBQ", price: 0 },
          { name: "Parmesan", price: 0 }
        ]
      }
    ]
  },

  // ================ RICE MEALS ================
  {
    name: "CHICKEN WINGS RICE MEAL",
    description: "Chicken wings served with rice",
    price: 160,
    category: "Rice Meals",
    image: "food/Buffalowingsricemeal.jpg",
    preparationTime: 15,
    tags: ["chicken", "rice"],
    displayOrder: 1
  },
  {
    name: "BURGER STEAK RICE MEAL",
    description: "Burger patty with mushroom gravy and rice",
    price: 170,
    category: "Rice Meals",
    image: "",
    preparationTime: 15,
    tags: ["beef", "rice"],
    displayOrder: 2
  },
  {
    name: "HOMEMADE CHORIZO WITH EGG",
    description: "Homemade chorizo with sunny-side-up egg and rice",
    price: 160,
    category: "Rice Meals",
    image: "food/Homemadechorizo.jpg",
    preparationTime: 12,
    tags: ["chorizo", "egg"],
    displayOrder: 3
  },
  {
    name: "CHICKEN TOCINO WITH EGG",
    description: "Sweet chicken tocino with egg and rice",
    price: 170,
    category: "Rice Meals",
    image: "food/Chickentocino.jpg",
    preparationTime: 12,
    tags: ["chicken", "sweet", "egg"],
    displayOrder: 4
  },
  {
    name: "BACON STEAK WITH EGG",
    description: "Bacon steak with sunny-side-up egg and rice",
    price: 180,
    category: "Rice Meals",
    image: "food/Baconsteak.jpg",
    preparationTime: 12,
    tags: ["bacon", "egg"],
    displayOrder: 5
  },

  // ================ YOGURT MILKSHAKES ================
  {
    name: "MANGO YOGURT MILKSHAKE",
    description: "Creamy yogurt milkshake with mango flavor",
    price: 120,
    category: "Yogurt Milkshakes",
    image: "",
    preparationTime: 8,
    tags: ["dessert", "refreshing"],
    displayOrder: 1
  },
  {
    name: "STRAWBERRY YOGURT MILKSHAKE",
    description: "Creamy yogurt milkshake with strawberry flavor",
    price: 120,
    category: "Yogurt Milkshakes",
    image: "",
    preparationTime: 8,
    tags: ["dessert", "refreshing"],
    displayOrder: 2
  },
  {
    name: "BLUEBERRY YOGURT MILKSHAKE",
    description: "Creamy yogurt milkshake with blueberry flavor",
    price: 120,
    category: "Yogurt Milkshakes",
    image: "",
    preparationTime: 8,
    tags: ["dessert", "refreshing"],
    displayOrder: 3
  },

  // ================ COFFEE ================
  {
    name: "AMERICANO",
    description: "Classic black coffee",
    price: 70,
    category: "Coffee",
    image: "",
    preparationTime: 5,
    tags: ["coffee", "classic"],
    displayOrder: 1,
    modifiers: [
      {
        name: "Temperature",
        required: true,
        options: [
          { name: "Hot", price: 60 },
          { name: "Cold", price: 70 }
        ]
      }
    ],
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "CAFE LATTE",
    description: "Espresso with steamed milk",
    price: 100,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "milk"],
    displayOrder: 2,
    modifiers: [
      {
        name: "Temperature",
        required: true,
        options: [
          { name: "Hot", price: 90 },
          { name: "Cold", price: 100 }
        ]
      }
    ],
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "CAFE MOCHA",
    description: "Chocolate-flavored latte",
    price: 100,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "chocolate"],
    displayOrder: 3,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "VANILLA LATTE",
    description: "Latte with vanilla flavor",
    price: 105,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "vanilla"],
    displayOrder: 4,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "SPANISH LATTE",
    description: "Latte with condensed milk",
    price: 105,
    category: "Coffee",
    image: "food/spanishlatte.jpg",
    preparationTime: 7,
    tags: ["coffee", "sweet"],
    displayOrder: 5,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "CARAMEL LATTE",
    description: "Latte with caramel flavor",
    price: 105,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "caramel"],
    displayOrder: 6,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "HAZELNUT LATTE",
    description: "Latte with hazelnut flavor",
    price: 105,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "nutty"],
    displayOrder: 7,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "SALTED LATTE",
    description: "Latte with a hint of salt",
    price: 105,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "salted"],
    displayOrder: 8,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "SALTED CARAMEL LATTE",
    description: "Latte with salted caramel flavor",
    price: 110,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "caramel", "salted"],
    displayOrder: 9,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },
  {
    name: "COCO-FREE (COCONUT MILK LATTE)",
    description: "Latte made with coconut milk",
    price: 110,
    category: "Coffee",
    image: "",
    preparationTime: 7,
    tags: ["coffee", "dairy-free", "coconut"],
    displayOrder: 10,
    addons: [
      {
        name: "Add Double Shot",
        price: 25
      }
    ]
  },

  // ================ COOLERS ================
  {
    name: "ALIMENTO SUNRISE",
    description: "Refreshing sunrise cooler",
    price: 140, // Default to cold price
    category: "Coolers",
    image: "",
    preparationTime: 5,
    tags: ["refreshing", "non-alcoholic"],
    displayOrder: 1,
    modifiers: [
      {
        name: "Temperature",
        required: true,
        options: [
          { name: "Hot", price: 75 },
          { name: "Cold", price: 140 }
        ]
      }
    ]
  },
  {
    name: "ALIMENTO CUCUMBER LEMONADE",
    description: "Refreshing cucumber lemonade",
    price: 140, // Default to cold price
    category: "Coolers",
    image: "",
    preparationTime: 5,
    tags: ["refreshing", "non-alcoholic"],
    displayOrder: 2,
    modifiers: [
      {
        name: "Temperature",
        required: true,
        options: [
          { name: "Hot", price: 75 },
          { name: "Cold", price: 140 }
        ]
      }
    ]
  },
  {
    name: "ALIMENTO ICED TEA",
    description: "Refreshing iced tea",
    price: 140, // Default to cold price
    category: "Coolers",
    image: "",
    preparationTime: 5,
    tags: ["refreshing", "non-alcoholic"],
    displayOrder: 3,
    modifiers: [
      {
        name: "Temperature",
        required: true,
        options: [
          { name: "Hot", price: 75 },
          { name: "Cold", price: 140 }
        ]
      }
    ]
  },
  {
    name: "COKE",
    description: "Regular Coca-Cola",
    price: 65,
    category: "Coolers",
    image: "",
    preparationTime: 2,
    tags: ["soda"],
    displayOrder: 4
  },
  {
    name: "COKE ZERO",
    description: "Coca-Cola Zero Sugar",
    price: 65,
    category: "Coolers",
    image: "",
    preparationTime: 2,
    tags: ["soda", "zero-sugar"],
    displayOrder: 5
  },
  {
    name: "SPRITE",
    description: "Lemon-lime soda",
    price: 65,
    category: "Coolers",
    image: "",
    preparationTime: 2,
    tags: ["soda", "lemon-lime"],
    displayOrder: 6
  },
  {
    name: "RITE N LITE",
    description: "Light and refreshing drink",
    price: 60,
    category: "Coolers",
    image: "",
    preparationTime: 2,
    tags: ["light", "refreshing"],
    displayOrder: 7
  }
];

module.exports = completeMenu;