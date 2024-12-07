const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const authMiddleware = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Place Order
router.post('/placeorder', authMiddleware, [
  check('shippingDetails').notEmpty().withMessage('Shipping details are required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const customerId = req.user.userId;
    const { shippingDetails } = req.body;

    // Find cart
    const cart = await Cart.findOne({ customerId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // Create order
    const order = new Order({
      customerId,
      items: cart.items,
      shippingDetails,
    });
    await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.json({ message: 'Order placed successfully', orderId: order._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Orders
router.get('/getallorders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name email')
      .populate('items.product', 'name price');

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Orders for Logged-in User
router.get('/myorders', authMiddleware, async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await Order.find({ customerId })
      .populate('items.product', 'name price description')
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ customerId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      currentPage: page,
      totalPages,
      totalOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Orders by Customer ID
router.get('/customer/:customerId', authMiddleware, async (req, res) => {
  const tokenUserId = req.user.userId.toString();
  const paramCustomerId = req.params.customerId.toString();

  console.log('Token userId:', tokenUserId);
  console.log('Requested customerId:', paramCustomerId);
  
  if (tokenUserId !== paramCustomerId) {
    console.log('Access denied: userId does not match customerId');
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const orders = await Order.find({ customerId: paramCustomerId })
      .populate('items.product', 'name price description')
      .sort({ orderDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const totalOrders = await Order.countDocuments({ customerId: paramCustomerId });
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      orders,
      currentPage: page,
      totalPages,
      totalOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;