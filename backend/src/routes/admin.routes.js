// Admin Routes
import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/auth.middleware.js';
import * as adminController from '../controller/admin.controller.js';

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// =================================================================
// DASHBOARD
// =================================================================
router.get('/dashboard/stats', adminController.getAdminDashboardStats);

// =================================================================
// USER MANAGEMENT
// =================================================================
router.get('/users', adminController.getAllUsers);
router.get('/users/stats', adminController.getUserStats);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// =================================================================
// RESTAURANT MANAGEMENT
// =================================================================
router.get('/restaurants', adminController.getAllRestaurantsAdmin);
router.get('/restaurants/stats', adminController.getRestaurantStats);
router.get('/restaurants/owners', adminController.getRestaurantOwners);
router.put('/restaurants/:id', adminController.updateRestaurantAdmin);
router.delete('/restaurants/:id', adminController.deleteRestaurantAdmin);

// =================================================================
// ORDER MANAGEMENT
// =================================================================
router.get('/orders', adminController.getAllOrdersAdmin);

export default router;

