import mongoose from 'mongoose';

// Schema for a single item within the order
const OrderItemSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number, // Price at the time of order
        required: true,
    },
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'MenuItem' // Reference to the actual menu item
    },
});

// Schema for the delivery address
const DeliveryAddressSchema = mongoose.Schema({
    street: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    // Optional: latitude and longitude for precise delivery tracking
    location: {
        lat: { type: Number },
        lng: { type: Number },
    }
});

// Main Order Schema
const OrderSchema = mongoose.Schema({
    // --- Key References ---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // The customer who placed the order
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Restaurant' // The restaurant preparing the food
    },
    // --- Order Details ---
    items: [OrderItemSchema],
    
    // --- Financial Details ---
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    deliveryFee: {
        type: Number,
        required: true,
        default: 0.0,
    },
    taxAmount: {
        type: Number,
        required: true,
        default: 0.0,
    },
    grandTotal: {
        type: Number,
        required: true,
        default: 0.0,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['CreditCard', 'DebitCard', 'PayPal', 'COD'], // Cash on Delivery (COD)
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    paidAt: {
        type: Date,
    },
    // --- Delivery and Status ---
    deliveryAddress: DeliveryAddressSchema,
    
    orderStatus: {
        type: String,
        required: true,
        enum: [
            'Pending',           // Placed, waiting for restaurant confirmation
            'Confirmed',         // Restaurant accepted the order
            'Preparing',         // Food is being cooked
            'Ready For Pickup',  // Food is packed
            'Out For Delivery',  // Driver has picked up the food
            'Delivered',         // Order successfully completed
            'Cancelled'          // Order was cancelled
        ],
        default: 'Pending',
    },
    deliveredAt: {
        type: Date,
    },
    // Optional: Link to the driver/delivery partner
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner'
    }

}, {
    timestamps: true // Adds createdAt and updatedAt
});

const Order = mongoose.model('Order', OrderSchema);

export default Order;