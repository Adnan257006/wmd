const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Please provide slot label (e.g. 12:00 PM - 12:15 PM)'],
      trim: true
    },
    startTime: {
      type: String,
      required: [true, 'Please provide start time in HH:mm format'],
      trim: true
    },
    endTime: {
      type: String,
      required: [true, 'Please provide end time in HH:mm format'],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify slot capacity'],
      default: 25,
      min: 1
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Slot', slotSchema);
