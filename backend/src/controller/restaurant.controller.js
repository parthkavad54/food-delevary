// Import models and utility functions
import Restaurant from '../models/restaurant.model.js'; // Assumed model
import MenuItem from '../models/menuItem.model.js';   // Assumed model
import Review from '../models/Review.model.js';       // Assumed model

// --- Utility Function (To be implemented in a real app) ---
// This function would check if the user is the owner of the restaurant or an Admin.
const isOwnerOrAdmin = (req, restaurant) => {
    // In a real application:
    // return req.user.role === 'admin' || restaurant.owner.toString() === req.user.id;
    
    // Mocking for demonstration
    return true; 
};

// =================================================================
// 1. GET ALL RESTAURANTS (Public Route)
// =================================================================
export const getAllRestaurants = async (req, res) => {
    try {
        // Build query object based on URL query parameters (e.g., /api/restaurants?city=Mumbai&cuisine=Italian)
        const query = { isActive: true };
        
        if (req.query.city) {
            query.city = req.query.city;
        }
        if (req.query.cuisine) {
            query.cuisine = req.query.cuisine;
        }

        // Add sorting, pagination, etc. logic here
        const restaurants = await Restaurant.find(query)
            .sort({ averageRating: -1 }) // Sort by highest rating by default
            .limit(20);

        if (!restaurants.length) {
            return res.status(404).json({ success: false, message: 'No restaurants found matching criteria.' });
        }

        res.status(200).json({ 
            success: true, 
            count: restaurants.length, 
            data: restaurants 
        });
    } catch (error) {
        console.error("Error fetching all restaurants:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching restaurants.' });
    }
};

// =================================================================
// 2. GET RESTAURANT DETAILS (Public Route)
// =================================================================
export const getRestaurantDetails = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant || !restaurant.isActive) {
            return res.status(404).json({ success: false, message: `Restaurant not found with ID of ${req.params.id}` });
        }

        // Fetch Menu Items associated with this restaurant
        const menuItems = await MenuItem.find({ restaurant: req.params.id, isAvailable: true }).sort({ category: 1, name: 1 });

        // Fetch a limited number of recent reviews
        const recentReviews = await Review.find({ restaurant: req.params.id })
            .populate('user', 'name') // Only fetch the user's name
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({ 
            success: true, 
            data: {
                restaurant,
                menu: menuItems,
                reviews: recentReviews
            }
        });
    } catch (error) {
        console.error("Error fetching restaurant details:", error);
        // Handle CastError if the ID format is invalid
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid restaurant ID format.' });
        }
        res.status(500).json({ success: false, message: 'Server error while fetching details.' });
    }
};

// =================================================================
// 3. CREATE NEW RESTAURANT (Private/Admin/Owner Route)
// =================================================================
export const createRestaurant = async (req, res) => {
    try {
        // Add the owner's ID (the currently logged-in user)
        req.body.owner = req.user.id; 
        
        const restaurant = await Restaurant.create(req.body);

        res.status(201).json({ 
            success: true, 
            message: 'Restaurant registered successfully.',
            data: restaurant 
        });
    } catch (error) {
        console.error("Error creating restaurant:", error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};

// =================================================================
// 4. UPDATE RESTAURANT DETAILS (Private/Admin/Owner Route)
// =================================================================
export const updateRestaurant = async (req, res) => {
    try {
        let restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: `Restaurant not found with ID of ${req.params.id}` });
        }
        
        // Authorization check: Make sure the user is the owner or an admin
        if (!isOwnerOrAdmin(req, restaurant)) {
             return res.status(403).json({ success: false, message: 'User not authorized to update this restaurant.' });
        }

        // Prevent updating the owner via this route
        delete req.body.owner; 
        
        restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true // Run Mongoose validation checks
        });

        res.status(200).json({ success: true, message: 'Restaurant updated successfully.', data: restaurant });

    } catch (error) {
        console.error("Error updating restaurant:", error);
        res.status(500).json({ success: false, message: 'Server error while updating restaurant.' });
    }
};

// =================================================================
// 5. DELETE/DEACTIVATE RESTAURANT (Private/Admin Route)
// =================================================================
export const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: `Restaurant not found with ID of ${req.params.id}` });
        }

        // Authorization check (Highly restricted action)
        if (!isOwnerOrAdmin(req, restaurant)) {
             return res.status(403).json({ success: false, message: 'User not authorized to delete this restaurant.' });
        }
        
        // Option 1: Hard Delete (For actual removal)
        // await restaurant.deleteOne();
        
        // Option 2: Soft Delete (Recommended: simply deactivate it)
        restaurant.isActive = false;
        await restaurant.save();

        res.status(200).json({ success: true, message: 'Restaurant deactivated successfully.', data: {} });

    } catch (error) {
        console.error("Error deleting restaurant:", error);
        res.status(500).json({ success: false, message: 'Server error while deleting restaurant.' });
    }
};