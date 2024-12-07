// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
    },
  ],
  shippingDetails: String,
  orderDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Processing' },
});

module.exports = mongoose.model('Order', orderSchema);