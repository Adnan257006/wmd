const mongoose = require('mongoose');

const wastageSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    prepared: {
      type: Number,
      required: true,
      min: 0
    },
    leftover: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

wastageSchema.index({ date: 1, menuItem: 1 }, { unique: true });

module.exports = mongoose.model('Wastage', wastageSchema);
