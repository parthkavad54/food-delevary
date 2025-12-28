// Restaurant Owner Routes
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as restaurantOwnerController from '../controller/restaurantOwner.controller.js';

// All restaurant owner routes require authentication and restaurant_owner role
router.use(protect);
router.use(authorize('restaurant_owner', 'admin'));

// =================================================================
// DASHBOARD
// =================================================================
router.get('/dashboard/stats', restaurantOwnerController.getRestaurantDashboardStats);
router.get('/restaurants', restaurantOwnerController.getMyRestaurants);
router.put('/restaurants/:id/toggle-status', restaurantOwnerController.toggleRestaurantStatus);

// =================================================================
// ORDER MANAGEMENT
// =================================================================
router.get('/orders', restaurantOwnerController.getRestaurantOrders);
router.get('/orders/:id', restaurantOwnerController.getRestaurantOrderById);
router.put('/orders/:id/status', restaurantOwnerController.updateOrderStatus);

// =================================================================
// MENU ITEM MANAGEMENT
// =================================================================
router.get('/menu-items', restaurantOwnerController.getRestaurantMenuItems);
router.post('/menu-items', restaurantOwnerController.createMenuItem);
router.put('/menu-items/:id', restaurantOwnerController.updateMenuItem);
router.delete('/menu-items/:id', restaurantOwnerController.deleteMenuItem);

export default router;

