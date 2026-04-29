// routes/payment.js
import express from 'express';
const router = express.Router();
import Order from '../models/order.model.js';
import { protect } from '../middleware/auth.middleware.js';

import Razorpay from 'razorpay';
import crypto from 'crypto';

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

// @route   POST /api/payment/create-razorpay-order
// @desc    Create Razorpay Order
// @access  Private
router.post('/create-razorpay-order', protect, async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    const rzp = getRazorpayInstance();
    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit
      currency: "INR",
      receipt: receipt
    };
    const order = await rzp.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// @route   POST /api/payment/process
// @desc    Process payment
// @access  Private
router.post('/process', protect, async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // For COD
    if (paymentMethod === 'COD') {
      order.isPaid = false;
      order.paidAt = null;
      order.orderStatus = 'Confirmed';
      await order.save();
      return res.json({
        success: true,
        message: 'Order processed successfully (COD)',
        order
      });
    }
    
    res.status(400).json({ success: false, message: 'Invalid payment processing method' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   POST /api/payment/verify
// @desc    Verify payment status
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId, paymentId, signature, razorpayOrderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Razorpay secret not configured' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + paymentId)
      .digest('hex');

    if (expectedSignature === signature) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.orderStatus = 'Confirmed';
      order.paymentMethod = 'CreditCard';
      await order.save();

      res.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully',
        order
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        message: 'Payment verification failed'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

// @route   POST /api/payment/refund
// @desc    Process refund
// @access  Private (Admin)
router.post('/refund', protect, async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund this order'
      });
    }

    // Process refund with payment gateway
    // In production: Call payment gateway refund API
    const refundSuccess = true;

    if (refundSuccess) {
      order.paymentStatus = 'refunded';
      order.status = 'cancelled';
      order.cancellationReason = reason || 'Refund processed';
      await order.save();

      res.json({
        success: true,
        message: 'Refund processed successfully',
        order
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Refund processing failed'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

export default router;