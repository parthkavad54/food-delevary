import express from 'express';
const router = express.Router();

// Import controllers and middleware
import * as restaurantController from '../controller/restaurant.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js'; 
// import { restaurantValidation } from '../middleware/validation/restaurant.validation.js'; // Optional

// --- PUBLIC ROUTES (Accessible to all users/customers) ---

/**
 * @route   GET /api/restaurants
 * @desc    Get a list of all active restaurants (e.g., filtered by location, category)
 * @access  Public
 * @query   ?city=Mumbai&category=Italian
 */
router.get(
    '/', 
    restaurantController.getAllRestaurants
);

/**
 * @route   GET /api/restaurants/:id
 * @desc    Get details for a single restaurant, including its menu and average rating
 * @access  Public
 * @params  id: The ID of the restaurant
 */
router.get(
    '/:id', 
    restaurantController.getRestaurantDetails
);

// --- PRIVATE/ADMIN ROUTES (Requires Authentication and Authorization) ---

// Middleware to protect routes and ensure the user is an owner/admin
const checkAdminOrOwner = authMiddleware.protect; // In a real app, this would also check the user's role

/**
 * @route   POST /api/restaurants
 * @desc    Register a new restaurant (Admin/Owner action)
 * @access  Private (Requires a special 'owner' or 'admin' role)
 * @body    { name: "...", address: "...", ... }
 */
router.post(
    '/', 
    checkAdminOrOwner, 
    // restaurantValidation, // Validate required fields
    restaurantController.createRestaurant
);

/**
 * @route   PUT /api/restaurants/:id
 * @desc    Update restaurant details (Owner/Admin action)
 * @access  Private
 * @params  id: The ID of the restaurant to update
 */
router.put(
    '/:id', 
    checkAdminOrOwner, 
    restaurantController.updateRestaurant
);

/**
 * @route   DELETE /api/restaurants/:id
 * @desc    Deactivate/Close a restaurant (Admin action)
 * @access  Private
 * @params  id: The ID of the restaurant
 */
router.delete(
    '/:id', 
    checkAdminOrOwner, 
    restaurantController.deleteRestaurant
);

export default router;