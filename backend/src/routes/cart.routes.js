import express from 'express';
// Assuming these are also using ES Modules syntax for export
import * as cartController from '../controller/cart.controller.js'; 
import * as authMiddleware from '../middleware/auth.middleware.js'; 

const router = express.Router();

// --- User Cart Routes ---

/**
 * @route   GET /api/cart
 * @desc    Get the current user's cart
 * @access  Private (Requires authentication)
*/
router.get(
    '/', 
    authMiddleware.protect, // Middleware to ensure the user is logged in
    cartController.getCart 
);

/**
 * @route   POST /api/cart/add
 * @desc    Add an item to the cart
 * @access  Private
 * @body    { "restaurantId": "...", "menuItemId": "...", "quantity": 1 }
 */
router.post(
    '/add', 
    authMiddleware.protect, 
    cartController.addItemToCart
);

/**
 * @route   PUT /api/cart/update/:itemId
 * @desc    Update the quantity of a specific item in the cart
 * @access  Private
 * @params  itemId: The ID of the menu item to update
 * @body    { "quantity": 3 }
 */
router.put(
    '/update/:itemId', 
    authMiddleware.protect, 
    cartController.updateCartItemQuantity
);

/**
 * @route   DELETE /api/cart/remove/:itemId
 * @desc    Remove a specific item from the cart
 * @access  Private
 * @params  itemId: The ID of the menu item to remove
 */
router.delete(
    '/remove/:itemId', 
    authMiddleware.protect, 
    cartController.removeItemFromCart
);

/**
 * @route   DELETE /api/cart/clear
 * @desc    Clear all items from the cart
 * @access  Private
 */
router.delete(
    '/clear', 
    authMiddleware.protect, 
    cartController.clearCart
);


export default router;