// Restaurant Owner Controller - Manage orders and menu items for their restaurant
import Restaurant from '../models/restaurant.model.js';
import Order from '../models/order.model.js';
import MenuItem from '../models/menuItem.model.js';

// =================================================================
// ORDER MANAGEMENT (Restaurant Owner)
// =================================================================

// Get all orders for restaurant owner's restaurants
export const getRestaurantOrders = async (req, res) => {
  try {
    // Find all restaurants owned by this user
    const restaurants = await Restaurant.find({ owner: req.user._id });
    const restaurantIds = restaurants.map(r => r._id);

    if (restaurantIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No restaurants found for this owner'
      });
    }

    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { restaurant: { $in: restaurantIds } };

    if (status) {
      query.orderStatus = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('restaurant', 'name address')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: orders
    });
  } catch (error) {
    console.error('Error fetching restaurant orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Get single order for restaurant owner
export const getRestaurantOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone addresses')
      .populate('restaurant', 'name address phone')
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the order belongs to one of the owner's restaurants
    const restaurant = await Restaurant.findById(order.restaurant._id);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
};

// Update order status (restaurant owner)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Preparing', 'Ready For Pickup', 'Out For Delivery', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify the order belongs to one of the owner's restaurants
    const restaurant = await Restaurant.findById(order.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    order.orderStatus = status;
    
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
};

// =================================================================
// MENU ITEM MANAGEMENT (Restaurant Owner)
// =================================================================

// Get all menu items for restaurant owner's restaurants
export const getRestaurantMenuItems = async (req, res) => {
  try {
    // Find all restaurants owned by this user
    const restaurants = await Restaurant.find({ owner: req.user._id });
    const restaurantIds = restaurants.map(r => r._id);

    if (restaurantIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'No restaurants found for this owner'
      });
    }

    const { restaurantId, category, isAvailable, search, page = 1, limit = 50 } = req.query;
    const query = { restaurant: { $in: restaurantIds } };

    if (restaurantId) {
      // Verify the restaurant belongs to the owner
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant || restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this restaurant'
        });
      }
      query.restaurant = restaurantId;
    }

    if (category) {
      query.category = category;
    }

    if (typeof isAvailable !== 'undefined') {
      query.isAvailable = isAvailable === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const menuItems = await MenuItem.find(query)
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MenuItem.countDocuments(query);

    res.status(200).json({
      success: true,
      count: menuItems.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu items'
    });
  }
};

// Create menu item
export const createMenuItem = async (req, res) => {
  try {
    const { restaurant, name, description, price, category, isAvailable, imageUrl } = req.body;

    // Verify the restaurant belongs to the owner
    const restaurantDoc = await Restaurant.findById(restaurant);
    if (!restaurantDoc) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurantDoc.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add menu items to this restaurant'
      });
    }

    const menuItem = new MenuItem({
      restaurant,
      name,
      description,
      price,
      category,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      imageUrl: imageUrl || 'no-photo.jpg'
    });

    await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating menu item',
      error: error.message
    });
  }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Verify the restaurant belongs to the owner
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu item'
      });
    }

    Object.assign(menuItem, req.body);
    await menuItem.save();

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating menu item'
    });
  }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Verify the restaurant belongs to the owner
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this menu item'
      });
    }

    await menuItem.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting menu item'
    });
  }
};

// =================================================================
// RESTAURANT DASHBOARD STATISTICS
// =================================================================

// Get restaurant owner dashboard statistics
export const getRestaurantDashboardStats = async (req, res) => {
  try {
    // Find all restaurants owned by this user
    const restaurants = await Restaurant.find({ owner: req.user._id });
    const restaurantIds = restaurants.map(r => r._id);

    if (restaurantIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalRestaurants: 0,
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          totalMenuItems: 0
        }
      });
    }

    const totalOrders = await Order.countDocuments({ restaurant: { $in: restaurantIds } });
    const pendingOrders = await Order.countDocuments({ 
      restaurant: { $in: restaurantIds },
      orderStatus: 'Pending'
    });
    const completedOrders = await Order.countDocuments({ 
      restaurant: { $in: restaurantIds },
      orderStatus: 'Delivered'
    });

    // Calculate total revenue from completed orders
    const revenueData = await Order.aggregate([
      { 
        $match: { 
          restaurant: { $in: restaurantIds },
          orderStatus: 'Delivered',
          isPaid: true
        }
      },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const totalMenuItems = await MenuItem.countDocuments({ restaurant: { $in: restaurantIds } });

    res.status(200).json({
      success: true,
      data: {
        totalRestaurants: restaurants.length,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        totalMenuItems
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// Get restaurants owned by the user
export const getMyRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching restaurants'
    });
  }
};

// Toggle restaurant open/close status (restaurant owner)
export const toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Verify the restaurant belongs to the owner
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    // Toggle isActive status
    restaurant.isActive = !restaurant.isActive;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: `Restaurant ${restaurant.isActive ? 'opened' : 'closed'} successfully`,
      data: restaurant
    });
  } catch (error) {
    console.error('Error toggling restaurant status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating restaurant status'
    });
  }
};

