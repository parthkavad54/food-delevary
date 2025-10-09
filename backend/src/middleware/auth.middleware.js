// middleware/auth.middleware.js

import jwt from 'jsonwebtoken';
import User from '../models/user.model.js'; // Ensure your model path is correct

// Protect routes - verify JWT token
export const protect = async (req, res, next) => { // <-- Use 'export const' instead of 'exports.protect'
    try {
        let token;

        // 1. Check for token in the Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route (No token)'
            });
        }

        try {
            // Verify token
            // Ensure process.env.JWT_SECRET is set, or the default is used
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret'); 
            
            // Get user from token (excluding the password field)
            req.user = await User.findById(decoded.id).select('-password'); 
            
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'User associated with token not found'
                });
            }

            if (!req.user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account has been deactivated'
                });
            }

            next();
        } catch (err) {
            // This catches expired or malformed JWTs
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error during token process'
        });
    }
};

// Grant access to specific roles
export const authorize = (...roles) => { // <-- Use 'export const' instead of 'exports.authorize'
    return (req, res, next) => {
        // req.user is populated by the protect middleware
        if (!req.user) {
            return res.status(500).json({ success: false, message: 'Authorization error: User not authenticated.' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Remove the line 'export default exports;' as it mixes module systems. 
// The named exports (protect, authorize) are sufficient.