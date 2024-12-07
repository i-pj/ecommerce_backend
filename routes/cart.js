const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const { check, validationResult } = require('express-validator');

// Add Product to Cart
router.post('/add', authMiddleware, [
  check('productId').notEmpty().withMessage('Product ID is required'),
  check('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const customerId = req.user.userId;
    const { productId, quantity } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      cart = new Cart({ customerId, items: [] });
    }

    // Check if product is already in cart
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();

    res.json({ message: 'Product added to cart', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Cart
router.put('/update', authMiddleware, [
  check('productId').notEmpty().withMessage('Product ID is required'),
  check('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const customerId = req.user.userId;
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(400).json({ error: 'Cart not found' });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(400).json({ error: 'Product not found in cart' });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product from Cart
router.delete('/delete', authMiddleware, [
  check('productId').notEmpty().withMessage('Product ID is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const customerId = req.user.userId;
    const { productId } = req.body;

    // Find cart
    let cart = await Cart.findOne({ customerId });
    if (!cart) {
      return res.status(400).json({ error: 'Cart not found' });
    }

    // Remove item from cart
    cart.items = cart.items.filter((item) => item.product.toString() !== productId);

    await cart.save();

    res.json({ message: 'Product removed from cart', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const customerId = req.user.userId;

    // Find cart
    const cart = await Cart.findOne({ customerId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.json({ message: 'Your cart is empty', cart: [] });
    }

    // Prepare cart details
    const cartDetails = cart.items.map(item => ({
      product: item.product.name,
      description: item.product.description,
      quantity: item.quantity,
      price: item.product.price,
      total: item.quantity * item.product.price
    }));

    const totalAmount = cartDetails.reduce((acc, item) => acc + item.total, 0);

    res.json({ cart: cartDetails, totalAmount });
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

// Get Orders by Customer ID
router.get('/orders/customer/:customerId', authMiddleware, async (req, res) => {
  // Validate that the customerId matches the logged-in user
  if (req.user.userId !== req.params.customerId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const orders = await Order.find({ customerId: req.params.customerId })
      .populate('items.product', 'name price')
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;