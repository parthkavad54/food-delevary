import express from 'express';
const router = express.Router();
// Import the controller functions and authentication middleware
import * as reviewsController from '../controller/reviews.controller.js'; 
import * as authMiddleware from '../middleware/auth.middleware.js'; 
// Optional: Import a validation file if you use express-validator
// import { reviewValidation } from '../middleware/validation/review.validation.js';

// --- Public Routes (Anyone can view reviews) ---

/**
 * @route   GET /api/reviews/restaurant/:restaurantId
 * @desc    Get all reviews for a specific restaurant
 * @access  Public
 * @params  restaurantId: The ID of the restaurant
 */
router.get(
    '/restaurant/:restaurantId', 
    reviewsController.getRestaurantReviews
);

/**
 * @route   GET /api/reviews/menuitem/:menuItemId
 * @desc    Get all reviews for a specific menu item
 * @access  Public
 * @params  menuItemId: The ID of the menu item
 */
router.get(
    '/menuitem/:menuItemId', 
    reviewsController.getMenuItemReviews
);

// --- Private Routes (Requires Authentication) ---

/**
 * @route   POST /api/reviews
 * @desc    Submit a new review for a restaurant OR a menu item
 * @access  Private (User must be logged in)
 * @body    { "rating": 5, "comment": "Great food!", "restaurantId": "..." } 
 * OR     { "rating": 4, "comment": "Tastes fresh!", "menuItemId": "..." }
 */
router.post(
    '/', 
    authMiddleware.protect, 
    // reviewValidation, // Optional: Add validation middleware here
    reviewsController.createReview
);

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Update a user's own review
 * @access  Private (Only the owner can update)
 * @params  reviewId: The ID of the review to update
 * @body    { "rating": 4, "comment": "Updated comment." }
 */
router.put(
    '/:reviewId', 
    authMiddleware.protect, 
    reviewsController.updateReview
);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a user's own review
 * @access  Private (Only the owner or an admin can delete)
 * @params  reviewId: The ID of the review to delete
 */
router.delete(
    '/:reviewId', 
    authMiddleware.protect, 
    reviewsController.deleteReview
);


export default router;