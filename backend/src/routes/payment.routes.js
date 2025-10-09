// routes/payment.js
import express from'express';
const router = express.Router();
import Order from'../models/order.model.js';
import { protect } from'../middleware/auth.middleware.js';

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

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Here you would integrate with payment gateways like:
    // - Stripe
    // - Razorpay
    // - PayPal
    // - etc.

    // For demo purposes, we'll simulate payment processing
    let paymentSuccess = true;
    let transactionId = '';

    if (paymentMethod === 'card') {
      // Simulate card payment processing
      transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      // In production: Call payment gateway API
      // const result = await processCardPayment(paymentDetails);
      // paymentSuccess = result.success;
      // transactionId = result.transactionId;
    } else if (paymentMethod === 'upi') {
      // Simulate UPI payment
      transactionId = `UPI${Date.now()}${Math.floor(Math.random() * 1000)}`;
    } else if (paymentMethod === 'wallet') {
      // Simulate wallet payment
      transactionId = `WAL${Date.now()}${Math.floor(Math.random() * 1000)}`;
    } else if (paymentMethod === 'cash') {
      // Cash on delivery - no transaction needed
      paymentSuccess = true;
    }

    if (paymentSuccess) {
      order.paymentStatus = paymentMethod === 'cash' ? 'pending' : 'completed';
      order.transactionId = transactionId;
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        note: 'Payment processed successfully',
        timestamp: new Date()
      });
      await order.save();

      res.json({
        success: true,
        message: 'Payment processed successfully',
        transactionId,
        order
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Payment processing failed'
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

// @route   POST /api/payment/verify
// @desc    Verify payment status
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId, transactionId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Verify with payment gateway
    // In production: Call payment gateway verification API
    const isVerified = order.transactionId === transactionId;

    res.json({
      success: true,
      verified: isVerified,
      paymentStatus: order.paymentStatus
    });
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