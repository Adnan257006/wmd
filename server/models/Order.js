const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [val => val.length > 0, 'Order must contain at least one item']
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true
    },
    orderDate: {
      type: Date,
      required: true,
      index: true
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['Placed', 'Preparing', 'Ready', 'Collected', 'Cancelled'],
      default: 'Placed',
      index: true
    },
    tokenNumber: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ slot: 1 });
orderSchema.index({ orderDate: 1, slot: 1 });
orderSchema.index({ orderDate: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
