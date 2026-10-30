const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      required: [true, 'Please specify category'],
      enum: ['Breakfast', 'Lunch', 'Snacks', 'Beverages']
    },
    price: {
      type: Number,
      required: [true, 'Please specify price'],
      min: 0
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    dailyLimit: {
      type: Number,
      default: null // null means unlimited
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
