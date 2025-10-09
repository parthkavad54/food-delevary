// middleware/validation.js
import { validationResult } from'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Common validation rules
const { body } = require('express-validator');

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number')
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const restaurantValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Restaurant name is required'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('cuisineType')
    .isArray({ min: 1 })
    .withMessage('At least one cuisine type is required'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
];

export const menuItemValidation = [
  body('restaurant')
    .notEmpty()
    .withMessage('Restaurant ID is required'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
];

export const orderValidation = [
  body('restaurant')
    .notEmpty()
    .withMessage('Restaurant ID is required'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['cash', 'card', 'upi', 'wallet'])
    .withMessage('Invalid payment method')
];

