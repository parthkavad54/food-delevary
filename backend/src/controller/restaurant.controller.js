// src/controller/restaurant.controller.js
import Restaurant from '../models/restaurant.model.js';

// =================================================================
// 1. GET ALL RESTAURANTS (Public Route)
// =================================================================
export const getAllRestaurants = async (req, res) => {
    try {
        const { city, cuisine, search } = req.query;
        const query = { isActive: true };

        if (city) query['address.city'] = { $regex: city, $options: 'i' };
        if (cuisine) query.cuisine = { $in: [cuisine] };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const restaurants = await Restaurant.find(query)
            .populate('owner', 'name email')
            .populate({
                path: 'menuItems',
                match: { isAvailable: true },
                select: 'name price imageUrl category'
            })
            .sort({ averageRating: -1, createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            count: restaurants.length, 
            data: restaurants 
        });
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching restaurants.' });
    }
};

// =================================================================
// 2. GET RESTAURANT DETAILS (Public Route)
// =================================================================
export const getRestaurantDetails = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .populate('owner', 'name email phone')
            .populate({
                path: 'menuItems',
                match: { isAvailable: true }
            });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        }

        res.status(200).json({ success: true, data: restaurant });
    } catch (error) {
        console.error("Error fetching restaurant details:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching details.' });
    }
};

// =================================================================
// 3. CREATE NEW RESTAURANT (Admin Only)
// =================================================================
export const createRestaurant = async (req, res) => {
    try {
        // Only admin can create restaurants
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only administrators can create restaurants.' 
            });
        }

        // If owner is specified, verify it exists and is a restaurant owner
        if (req.body.owner) {
            const User = (await import('../models/user.model.js')).default;
            const owner = await User.findById(req.body.owner);
            if (!owner || owner.role !== 'restaurant_owner') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid owner. Owner must be a restaurant owner.' 
                });
            }
            
            // Check if owner already has a restaurant
            const existingRestaurant = await Restaurant.findOne({ owner: req.body.owner });
            if (existingRestaurant) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'This owner already has a restaurant.' 
                });
            }
        } else {
            return res.status(400).json({ 
                success: false, 
                message: 'Owner is required.' 
            });
        }
        
        // Create restaurant
        const restaurant = await Restaurant.create(req.body);

        res.status(201).json({ 
            success: true, 
            message: 'Restaurant created successfully.',
            data: restaurant 
        });
    } catch (error) {
        console.error("Error creating restaurant:", error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: messages.join(', ') 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error during restaurant creation.' 
        });
    }
};

// =================================================================
// 4. UPDATE RESTAURANT DETAILS (Owner/Admin Route)
// =================================================================
export const updateRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        }

        // Check if user is owner or admin
        const isOwner = restaurant.owner.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this restaurant.' 
            });
        }

        // Update restaurant
        Object.assign(restaurant, req.body);
        await restaurant.save();

        res.status(200).json({ 
            success: true, 
            message: 'Restaurant updated successfully.',
            data: restaurant 
        });
    } catch (error) {
        console.error("Error updating restaurant:", error);
        res.status(500).json({ success: false, message: 'Server error during update.' });
    }
};

// =================================================================
// 5. DELETE/DEACTIVATE RESTAURANT (Admin Route)
// =================================================================
export const deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found.' });
        }

        // Only admin can delete, or owner can deactivate their own
        if (req.user.role !== 'admin' && restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this restaurant.' 
            });
        }

        // Soft delete - deactivate
        restaurant.isActive = false;
        await restaurant.save();

        res.status(200).json({ 
            success: true, 
            message: 'Restaurant deactivated successfully.' 
        });
    } catch (error) {
        console.error("Error deleting restaurant:", error);
        res.status(500).json({ success: false, message: 'Server error during deletion.' });
    }
};
