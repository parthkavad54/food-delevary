import mongoose from 'mongoose';

const MenuItemSchema = mongoose.Schema({
    // Link to the Restaurant that owns this item
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Restaurant' // Assumes you have a 'Restaurant' model
    },
    // General information about the item
    name: {
        type: String,
        required: [true, 'Menu item must have a name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Menu item must have a description'],
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    // Pricing and category
    price: {
        type: Number,
        required: [true, 'Menu item must have a price'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: String,
        required: [true, 'Menu item must have a category (e.g., Appetizer, Main Course, Dessert)'],
        enum: ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Side', 'Pizza', 'Burger'], // Example categories
        default: 'Main Course'
    },
    // Inventory or availability status
    isAvailable: {
        type: Boolean,
        default: true
    },
    // Optional: URL to the image of the food item
    imageUrl: {
        type: String,
        default: 'no-photo.jpg'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Create an index to quickly find items by restaurant and name
MenuItemSchema.index({ restaurant: 1, name: 1 }, { unique: true });

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

export default MenuItem;