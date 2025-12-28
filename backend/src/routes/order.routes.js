// routes/orders.js
import express from'express';
const router = express.Router();
import Order from'../models/order.model.js';
import { protect, authorize } from'../middleware/auth.middleware.js';

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Customer)
router.post('/', protect, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      user: req.user._id
    };

    const order = new Order(orderData);
    await order.save();

    await order.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'restaurant', select: 'name address phone' },
      { path: 'items.menuItem', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (filtered by role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    // Customer sees only their orders
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    }
    // Restaurant owner sees orders for their restaurants
    else if (req.user.role === 'restaurant_owner') {
      const Restaurant = (await import('../models/restaurant.model.js')).default;
      const restaurants = await Restaurant.find({ owner: req.user._id });
      const restaurantIds = restaurants.map(r => r._id);
      query.restaurant = { $in: restaurantIds };
    }
    // Delivery person sees assigned orders
    else if (req.user.role === 'delivery_person') {
      query.driver = req.user._id;
    }
    // Admin sees all orders

    const { status, startDate, endDate } = req.query;

    if (status) {
      query.orderStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address phone')
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address phone')
      .populate('items.menuItem')
      .populate('driver', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    const isCustomer = order.user._id.toString() === req.user._id.toString();
    const isDelivery = order.driver && order.driver._id.toString() === req.user._id.toString();
    const isRestaurantOwner = req.user.role === 'restaurant_owner';
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isDelivery && !isRestaurantOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Restaurant/Delivery/Admin)
router.put('/:id/status', protect, authorize('restaurant_owner', 'delivery_person', 'admin'), async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status
    order.orderStatus = status;

    // Update delivery time
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   PUT /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private (Customer/Admin)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if customer owns the order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (['Delivered', 'Cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    order.orderStatus = 'Cancelled';

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   PUT /api/orders/:id/assign-delivery
// @desc    Assign delivery person to order
// @access  Private (Admin)
router.put('/:id/assign-delivery', protect, authorize('admin'), async (req, res) => {
  try {
    const { deliveryPersonId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.driver = deliveryPersonId;
    await order.save();

    res.json({
      success: true,
      message: 'Delivery person assigned successfully',
      order
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

export default router;