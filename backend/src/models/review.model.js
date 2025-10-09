import mongoose from 'mongoose';

const ReviewSchema = mongoose.Schema({
    // --- Author and Target ---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // The customer who submitted the review
    },
    
    // The specific entity being reviewed. Only one of the following should be present.
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: function() {
            // Require 'restaurant' OR 'menuItem', but not both.
            return !this.menuItem;
        }
    },
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: function() {
            // Require 'menuItem' OR 'restaurant', but not both.
            return !this.restaurant;
        }
    },

    // --- Review Details ---
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot be more than 5'],
        default: 5
    },
    comment: {
        type: String,
        required: [true, 'Please leave a comment for your review'],
        trim: true,
        maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    
    // Optional: Could be used to link the review back to a specific order
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// ----------------------------------------------------------------------
// OPTIONAL: Prevent a user from leaving multiple reviews on the same entity (Restaurant or MenuItem)
// ----------------------------------------------------------------------

// 1. Index for unique Restaurant Reviews
ReviewSchema.index({ user: 1, restaurant: 1 }, { unique: true, partialFilterExpression: { restaurant: { $exists: true } } });

// 2. Index for unique MenuItem Reviews
ReviewSchema.index({ user: 1, menuItem: 1 }, { unique: true, partialFilterExpression: { menuItem: { $exists: true } } });


// Use Mongoose's built-in check to see if the model exists before compiling it.
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;