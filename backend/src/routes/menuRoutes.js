const express = require('express');
const router = express.Router();

// GET all menu items
router.get('/', (req, res) => {
    const sampleMenu = [
        { 
            id: 1, 
            code: "PAS-001", 
            name: "CHORIZO JALAPENO", 
            price: 200, 
            category: "Pasta", 
            is_available: true 
        },
        { 
            id: 2, 
            code: "PAS-002", 
            name: "CLASSIC CARBONARA", 
            price: 220, 
            category: "Pasta", 
            is_available: true 
        },
        { 
            id: 3, 
            code: "SAN-001", 
            name: "THICK CUT BACON", 
            price: 180, 
            category: "Sandwich", 
            is_available: true 
        },
        { 
            id: 4, 
            code: "COC-001", 
            name: "TEQUILA SUNRISE", 
            price: 120, 
            category: "Cocktail", 
            is_available: true 
        },
        { 
            id: 5, 
            code: "COC-002", 
            name: "MOJITO", 
            price: 120, 
            category: "Cocktail", 
            is_available: true 
        },
        { 
            id: 6, 
            code: "SID-001", 
            name: "NACHORIZO", 
            price: 190, 
            category: "Side", 
            is_available: true 
        }
    ];
    res.json(sampleMenu);
});

module.exports = router;
