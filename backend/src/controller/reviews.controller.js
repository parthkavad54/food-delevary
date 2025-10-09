import Review from '../models/review.model.js';
import Restaurant from '../models/restaurant.model.js';
import MenuItem from '../models/menuItem.model.js';

// --- Utility function to update the average rating and count on the target model ---
const updateAverageRating = async (targetId, isRestaurant = true) => {
    // 1. Determine the target model and field
    const Model = isRestaurant ? Restaurant : MenuItem;
    const reviewField = isRestaurant ? 'restaurant' : 'menuItem';
    
    // 2. Aggregate reviews for the target entity
    const stats = await Review.aggregate([
        {
            $match: { [reviewField]: targetId }
        },
        {
            $group: {
                _id: `$${reviewField}`,
                averageRating: { $avg: '$rating' },
                numOfReviews: { $sum: 1 }
            }
        }
    ]);
    
    // 3. Update the target model (Restaurant or MenuItem)
    if (stats.length > 0) {
        await Model.findByIdAndUpdate(targetId, {
            averageRating: stats[0].averageRating,
            numOfReviews: stats[0].numOfReviews
        }, { new: true });
    } else {
        // Reset if no reviews exist (e.g., all were deleted)
        await Model.findByIdAndUpdate(targetId, {
            averageRating: 0,
            numOfReviews: 0
        }, { new: true });
    }
};

// =================================================================
// 1. GET REVIEWS BY RESTAURANT (Public)
// =================================================================
export const getRestaurantReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ restaurant: req.params.restaurantId })
            .populate('user', 'name') // Show reviewer name
            .sort({ createdAt: -1 });

        if (!reviews) {
            return res.status(404).json({ success: false, message: 'No reviews found for this restaurant.' });
        }

        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        console.error("Error fetching restaurant reviews:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching reviews.' });
    }
};

// =================================================================
// 2. GET REVIEWS BY MENU ITEM (Public)
// =================================================================
export const getMenuItemReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ menuItem: req.params.menuItemId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        if (!reviews) {
            return res.status(404).json({ success: false, message: 'No reviews found for this menu item.' });
        }

        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        console.error("Error fetching menu item reviews:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching reviews.' });
    }
};

// =================================================================
// 3. CREATE REVIEW (Private)
// =================================================================
export const createReview = async (req, res) => {
    const { rating, comment, restaurantId, menuItemId, orderId } = req.body;
    
    // Ensure only one target is provided
    if (!restaurantId && !menuItemId) {
        return res.status(400).json({ success: false, message: 'Must provide either restaurantId or menuItemId.' });
    }
    if (restaurantId && menuItemId) {
        return res.status(400).json({ success: false, message: 'Cannot review both a restaurant and a menu item at once.' });
    }

    try {
        // Set the user ID from the authenticated user
        const reviewData = {
            user: req.user.id,
            rating,
            comment,
            restaurant: restaurantId,
            menuItem: menuItemId,
            order: orderId // Optional link to the order
        };
        
        // Check if the user has already reviewed this entity (based on unique index in model)
        const existingReview = await Review.findOne({
            user: req.user.id,
            ...(restaurantId ? { restaurant: restaurantId } : {}),
            ...(menuItemId ? { menuItem: menuItemId } : {})
        });

        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already submitted a review for this item/restaurant.' });
        }
        
        const newReview = await Review.create(reviewData);

        // Update the average rating on the target model
        const isRestaurantReview = !!restaurantId;
        const targetId = restaurantId || menuItemId;
        await updateAverageRating(targetId, isRestaurantReview);

        res.status(201).json({ success: true, message: 'Review submitted successfully.', data: newReview });

    } catch (error) {
        console.error("Error creating review:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error while submitting review.' });
    }
};

// =================================================================
// 4. UPDATE REVIEW (Private)
// =================================================================
export const updateReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: `Review not found with ID of ${req.params.reviewId}` });
        }

        // Authorization check: Only the owner can update
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this review.' });
        }

        const { rating, comment } = req.body;
        
        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        
        const updatedReview = await review.save();

        // Update the average rating on the target model after change
        const isRestaurantReview = !!updatedReview.restaurant;
        const targetId = updatedReview.restaurant || updatedReview.menuItem;
        await updateAverageRating(targetId, isRestaurantReview);

        res.status(200).json({ success: true, message: 'Review updated successfully.', data: updatedReview });

    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ success: false, message: 'Server error while updating review.' });
    }
};

// =================================================================
// 5. DELETE REVIEW (Private)
// =================================================================
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: `Review not found with ID of ${req.params.reviewId}` });
        }

        // Authorization check
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
        }

        const isRestaurantReview = !!review.restaurant;
        const targetId = review.restaurant || review.menuItem;
        
        await review.deleteOne();

        // Update the average rating on the target model after deletion
        await updateAverageRating(targetId, isRestaurantReview);

        res.status(200).json({ success: true, message: 'Review deleted successfully.' });

    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ success: false, message: 'Server error while deleting review.' });
    }
};