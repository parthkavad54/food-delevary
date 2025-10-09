// src/middleware/errorHandler.js

// Custom error class
export class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    console.error(err.stack); // Log full error stack

    // Mongoose bad ObjectId (CastError)
    if (err.name === 'CastError') {
        error.message = `Resource not found with ID of ${err.value}`;
        error.statusCode = 404;
    }

    // Mongoose duplicate key error (E11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error.message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
        error.statusCode = 400;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message).join(', ');
        error.message = messages;
        error.statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error.message = 'Token is invalid or expired.';
        error.statusCode = 401;
    }

    res.status(error.statusCode).json({
        success: false,
        message: error.message,
        // Show stack trace only in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};