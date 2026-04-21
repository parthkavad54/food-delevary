// Admin Controller - Manage all restaurants and users
import User from '../models/user.model.js';
import Restaurant from '../models/restaurant.model.js';
import Order from '../models/order.model.js';

// =================================================================
// OTP UTILITY FUNCTIONS
// =================================================================

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const sendOTPViaSMS = async (phoneNumber, otp) => {
  // TODO: Implement actual SMS sending using Twilio or similar service
  // For now, we'll just log it
  console.log(`[OTP] Sent to ${phoneNumber}: ${otp}`);
  return true;
};

// =================================================================
// USER MANAGEMENT
// =================================================================

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
};

// Get single user
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user'
    });
  }
};

// Create user (Admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, isActive, isVerified } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and phone are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'customer',
      isActive: typeof isActive === 'boolean' ? isActive : true,
      isVerified: typeof isVerified === 'boolean' ? isVerified : true
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating user'
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive, isVerified } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (typeof isVerified === 'boolean') user.isVerified = isVerified;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user'
    });
  }
};

// Delete/Deactivate user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Special handling for admin deactivation
    if (user.role === 'admin') {
      // Check if this is the last admin
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate the last admin. Please create another admin account first.'
        });
      }

      // For admin deactivation, OTP verification is required
      const { otp } = req.body;
      
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'OTP is required to deactivate an admin account. Request OTP first.',
          requiresOTP: true
        });
      }

      // Verify OTP
      if (!user.otpCode || user.otpCode !== otp) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        await user.save();

        if (user.otpAttempts >= 3) {
          user.otpCode = null;
          user.otpExpiresAt = null;
          user.otpAttempts = 0;
          await user.save();
          return res.status(400).json({
            success: false,
            message: 'Incorrect OTP. Too many attempts. Please request a new OTP.'
          });
        }

        return res.status(400).json({
          success: false,
          message: 'Incorrect OTP. Please try again.'
        });
      }

      // Check if OTP is expired
      if (new Date() > user.otpExpiresAt) {
        user.otpCode = null;
        user.otpExpiresAt = null;
        user.otpAttempts = 0;
        await user.save();
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        });
      }

      // OTP is valid, clear OTP fields
      user.otpCode = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: `${user.role === 'admin' ? 'Admin' : 'User'} deactivated successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user'
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const customers = await User.countDocuments({ role: 'customer' });
    const restaurantOwners = await User.countDocuments({ role: 'restaurant_owner' });
    const admins = await User.countDocuments({ role: 'admin' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        customers,
        restaurantOwners,
        admins
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics'
    });
  }
};

// =================================================================
// ADMIN DEACTIVATION WITH OTP
// =================================================================

// Request OTP for admin deactivation
export const requestAdminDeactivationOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow OTP request for admin users
    if (user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'OTP deactivation is only for admin users'
      });
    }

    // Check if this is the last admin
    const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request OTP for the last admin. Please create another admin account first.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otp;
    user.otpExpiresAt = expiresAt;
    user.otpAttempts = 0;
    await user.save();

    // Send OTP via SMS
    await sendOTPViaSMS(user.phone, otp);

    res.status(200).json({
      success: true,
      message: `OTP sent to ${user.phone}. OTP expires in 10 minutes.`,
      phoneNumber: user.phone.slice(-4), // Only show last 4 digits for security
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Error requesting OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while requesting OTP'
    });
  }
};

// =================================================================
// RESTAURANT MANAGEMENT
// =================================================================

// Get all restaurants (admin view)
export const getAllRestaurantsAdmin = async (req, res) => {
  try {
    const { isActive, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (typeof isActive !== 'undefined') {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const restaurants = await Restaurant.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Restaurant.countDocuments(query);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
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

// Update restaurant (admin)
export const updateRestaurantAdmin = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Admin can update any field including isActive
    Object.assign(restaurant, req.body);
    await restaurant.save();

    await restaurant.populate('owner', 'name email phone');

    res.status(200).json({
      success: true,
      message: 'Restaurant updated successfully',
      data: restaurant
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating restaurant'
    });
  }
};

// Delete restaurant (admin)
export const deleteRestaurantAdmin = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    restaurant.isActive = false;
    await restaurant.save();

    res.status(200).json({
      success: true,
      message: 'Restaurant deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting restaurant'
    });
  }
};

// Get restaurant statistics
export const getRestaurantStats = async (req, res) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
    const inactiveRestaurants = totalRestaurants - activeRestaurants;

    res.status(200).json({
      success: true,
      data: {
        totalRestaurants,
        activeRestaurants,
        inactiveRestaurants
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching restaurant statistics'
    });
  }
};

// Get all restaurant owners (for assigning restaurants)
export const getRestaurantOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: 'restaurant_owner', isActive: true })
      .select('name email phone')
      .sort({ name: 1 });

    // Check which owners already have restaurants
    const ownersWithRestaurants = await Restaurant.find({})
      .select('owner')
      .distinct('owner');

    const ownersList = owners.map(owner => ({
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      hasRestaurant: ownersWithRestaurants.some(id => id.toString() === owner._id.toString())
    }));

    res.status(200).json({
      success: true,
      data: ownersList
    });
  } catch (error) {
    console.error('Error fetching restaurant owners:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching restaurant owners'
    });
  }
};

// =================================================================
// ORDER MANAGEMENT (Admin View)
// =================================================================

// Get all orders (admin)
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

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
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
};

// Get admin dashboard statistics
export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalRestaurants = await Restaurant.countDocuments();
    const activeRestaurants = await Restaurant.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'Delivered' });

    // Calculate total revenue from completed orders
    const revenueData = await Order.aggregate([
      { $match: { orderStatus: 'Delivered' } },
      { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        restaurants: {
          total: totalRestaurants,
          active: activeRestaurants,
          inactive: totalRestaurants - activeRestaurants
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders
        },
        revenue: {
          total: totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

