const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { check, validationResult } = require('express-validator');

// Add Product
router.post('/', [
  check('name').notEmpty().withMessage('Product name is required'),
  check('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, description, price, category } = req.body;

    // Create and save product
    const product = new Product({ name, description, price, category });
    await product.save();

    res.status(201).json({ message: 'Product added successfully', productId: product._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Product
router.put('/updateproduct/:productId', [
  check('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  check('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { productId } = req.params;
    const updates = req.body;

    // Validate product ID
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update only provided fields
    Object.keys(updates).forEach((key) => {
      product[key] = updates[key];
    });

    await product.save();

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Product
router.delete('/deleteproduct/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate product ID
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = category ? { category } : {};

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;