const Order = require('../models/Order');
const Slot = require('../models/Slot');

/**
 * Generates a unique token number for an order on a given date and slot.
 * Format: Letter (derived from slot) + '-' + incrementing number (e.g. A-101)
 */
const generateTokenNumber = async (slotId, orderDate) => {
  // Retrieve all slots sorted by startTime to determine the slot group letter
  const slots = await Slot.find().sort({ startTime: 1 });
  const slotIndex = slots.findIndex(s => s._id.toString() === slotId.toString());
  const letterCode = slotIndex >= 0 ? String.fromCharCode(65 + (slotIndex % 26)) : 'T';

  // Normalize orderDate range (start of day to end of day)
  const startOfDay = new Date(orderDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(orderDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Count existing orders created for this orderDate
  const existingOrdersCount = await Order.countDocuments({
    orderDate: { $gte: startOfDay, $lte: endOfDay }
  });

  let counter = 101 + existingOrdersCount;
  let candidateToken = `${letterCode}-${counter}`;

  // Ensure absolute uniqueness for the day
  let tokenExists = await Order.findOne({
    orderDate: { $gte: startOfDay, $lte: endOfDay },
    tokenNumber: candidateToken
  });

  while (tokenExists) {
    counter += 1;
    candidateToken = `${letterCode}-${counter}`;
    tokenExists = await Order.findOne({
      orderDate: { $gte: startOfDay, $lte: endOfDay },
      tokenNumber: candidateToken
    });
  }

  return candidateToken;
};

module.exports = { generateTokenNumber };
