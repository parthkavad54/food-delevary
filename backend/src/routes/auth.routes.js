// routes/auth.js
import express from "express";
const router = express.Router();
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import passport from 'passport';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, firstName, lastName, email, password, phone, role, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      firstName: firstName || '',
      lastName: lastName || '',
      name,
      email,
      password,
      phone,
      role: role || 'customer',
      addresses: address
        ? [{
            label: 'Home',
            street: String(address),
            city: '',
            state: '',
            zipCode: '',
            country: 'India',
            isDefault: true
          }]
        : []
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// =================================================================
// OAuth (Google / Facebook)
// =================================================================

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(501).json({
      success: false,
      message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html?oauth=google&error=1' }),
  async (req, res) => {
    const user = req.user;
    const token = generateToken(user._id);
    const redirect = process.env.FRONTEND_OAUTH_SUCCESS_REDIRECT || '/login.html';
    res.redirect(`${redirect}?token=${encodeURIComponent(token)}`);
  }
);

router.get('/facebook', (req, res, next) => {
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return res.status(501).json({
      success: false,
      message: 'Facebook OAuth is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.'
    });
  }
  return passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
});

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login.html?oauth=facebook&error=1' }),
  async (req, res) => {
    const user = req.user;
    const token = generateToken(user._id);
    const redirect = process.env.FRONTEND_OAUTH_SUCCESS_REDIRECT || '/login.html';
    res.redirect(`${redirect}?token=${encodeURIComponent(token)}`);
  }
);

export default router;