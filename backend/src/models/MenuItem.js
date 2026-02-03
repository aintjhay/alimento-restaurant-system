const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { 
        type: String, 
        required: true,
        enum: ['Meals', 'Drinks', 'Appetizers', 'Desserts', 'Specials', 'Breakfast']
    },
    imageUrl: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15 },
    ingredients: [{ name: String, quantity: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
