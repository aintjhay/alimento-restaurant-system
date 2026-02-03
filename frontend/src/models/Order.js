const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    menuItemId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    specialInstructions: String
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    tableNumber: {
        type: String,
        required: true
    },
    orderType: {
        type: String,
        enum: ['Dine-in', 'Takeaway', 'Delivery'],
        default: 'Dine-in'
    },
    customerName: String,
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'refunded'],
        default: 'unpaid'
    },
    notes: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const today = new Date();
        const dateStr = today.getFullYear().toString().slice(-2) + 
                       (today.getMonth() + 1).toString().padStart(2, '0') + 
                       today.getDate().toString().padStart(2, '0');
        
        const count = await this.constructor.countDocuments({
            orderNumber: new RegExp('^ORD-' + dateStr)
        });
        
        this.orderNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Order', orderSchema);
