// routes/menu.js
import express from'express';
const router = express.Router();
import MenuItem from'../models/menuItem.model.js';
import Restaurant from'../models/restaurant.model.js';
import { protect, authorize } from'../middleware/auth.middleware.js';

// @route   GET /api/menu/restaurant/:restaurantId
// @desc    Get menu items for a restaurant
// @access  Public
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { category, isVegetarian, isVegan, search } = req.query;
    let query = { restaurant: req.params.restaurantId, isAvailable: true };

    if (category) {
      query.category = category;
    }

    if (isVegetarian === 'true') {
      query.isVegetarian = true;
    }

    if (isVegan === 'true') {
      query.isVegan = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const menuItems = await MenuItem.find(query).populate('restaurant', 'name');

    res.json({
      success: true,
      count: menuItems.length,
      menuItems
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/menu/:id
// @desc    Get single menu item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant', 'name address');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      menuItem
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   POST /api/menu
// @desc    Create menu item
// @access  Private (Restaurant Owner)
router.post('/', protect, authorize('restaurant_owner', 'admin'), async (req, res) => {
  try {
    // Verify restaurant ownership
    const restaurant = await Restaurant.findById(req.body.restaurant);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add menu items to this restaurant'
      });
    }

    const menuItem = new MenuItem(req.body);
    await menuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Restaurant Owner)
router.put('/:id', protect, authorize('restaurant_owner', 'admin'), async (req, res) => {
  try {
    let menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Check authorization
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this menu item'
      });
    }

    menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Restaurant Owner)
router.delete('/:id', protect, authorize('restaurant_owner', 'admin'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('restaurant');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Check authorization
    if (menuItem.restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this menu item'
      });
    }

    await menuItem.deleteOne();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
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