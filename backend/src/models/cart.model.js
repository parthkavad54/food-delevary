import mongoose from 'mongoose';

const CartItemSchema = mongoose.Schema({
    menuItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'MenuItem' // Reference to your MenuItem model
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Restaurant' // Reference to the restaurant
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 }
});

const CartSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Reference to your User model
        unique: true // A user should only have one active cart
    },
    items: [CartItemSchema],
    totalPrice: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Cart = mongoose.model('Cart', CartSchema);

export default Cart;